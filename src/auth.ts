import type { DefaultSession } from "next-auth";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { allowLoginAttempt, consumeOtp } from "@/lib/auth/otp-store";
import { touchLastAuth } from "@/lib/auth/session-version";
import { clientIp } from "@/lib/http/client-ip";
import { db } from "@/lib/db";

class RateLimitedSignin extends CredentialsSignin {
  code = "RATE_LIMITED";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      sessionVersion?: number;
      authenticatedAt?: string;
      googleLinked?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    sessionVersion?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    googleSub?: string;
    checkedAt?: number;
    sessionVersion?: number;
    authenticatedAt?: number;
  }
}

const passwordCredentialsSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().regex(/^\+46\d{7,12}$/).optional(),
    password: z.string().min(8).max(128),
  })
  .refine((value) => Boolean(value.email || value.phone));

const phoneCredentialsSchema = z.object({
  phone: z.string().regex(/^\+46\d{7,12}$/),
  code: z.string().regex(/^\d{6}$/),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
});

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "Student",
    lastName: parts.slice(1).join(" "),
  };
}

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/logga-in", error: "/logga-in" },
  providers: [
    Credentials({
      id: "email-password",
      name: "Email and password",
      credentials: {
        email: { type: "email" },
        phone: { type: "tel" },
        password: { type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = passwordCredentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const now = new Date();
        if (
          !(await allowLoginAttempt(
            parsed.data.email ?? parsed.data.phone ?? "unknown",
            clientIp(request),
            now,
          ))
        ) {
          throw new RateLimitedSignin();
        }

        const user = parsed.data.phone
          ? await db.user.findUnique({
              where: { phone: parsed.data.phone, deletedAt: null },
            })
          : await db.user.findUnique({
              where: { email: parsed.data.email, deletedAt: null },
            });
        if (
          !user?.passwordHash ||
          !(await bcrypt.compare(parsed.data.password, user.passwordHash))
        ) {
          return null;
        }

        await touchLastAuth(user.id, now);

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { type: "tel" },
        code: { type: "text" },
        firstName: { type: "text" },
        lastName: { type: "text" },
      },
      async authorize(credentials, request) {
        const parsed = phoneCredentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const now = new Date();
        if (
          !(await allowLoginAttempt(
            `otp:${parsed.data.phone}`,
            clientIp(request),
            now,
          ))
        ) {
          throw new RateLimitedSignin();
        }
        if (!(await consumeOtp(parsed.data.phone, parsed.data.code, now))) {
          return null;
        }

        let user = await db.user.findUnique({
          where: { phone: parsed.data.phone, deletedAt: null },
        });

        if (!user) {
          if (!parsed.data.firstName || !parsed.data.lastName) {
            return null;
          }

          user = await db.user.create({
            data: {
              phone: parsed.data.phone,
              phoneVerifiedAt: now,
              firstName: parsed.data.firstName,
              lastName: parsed.data.lastName,
              studentProfile: { create: {} },
            },
          });
        } else if (!user.phoneVerifiedAt) {
          user = await db.user.update({
            where: { id: user.id },
            data: { phoneVerifiedAt: now },
          });
        }

        await touchLastAuth(user.id, now);

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
    ...(googleId && googleSecret
      ? [
          Google({
            clientId: googleId,
            clientSecret: googleSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const sub = account.providerAccountId;
      if (!sub) return false;
      let dbUser = await db.user.findUnique({ where: { googleSub: sub } });
      if (!dbUser) {
        const email =
          typeof profile?.email === "string"
            ? profile.email.trim().toLowerCase()
            : null;
        const emailVerified =
          "email_verified" in (profile ?? {}) &&
          profile?.email_verified === true;
        const name = splitName(
          typeof profile?.name === "string" ? profile.name : "Student",
        );
        const matchingEmail = email
          ? await db.user.findUnique({ where: { email } })
          : null;
        const staffAccount =
          emailVerified &&
          email?.endsWith("@makina.se") &&
          matchingEmail &&
          !matchingEmail.deletedAt
            ? matchingEmail
            : null;
        const linkableEmail =
          staffAccount ??
          (emailVerified &&
          matchingEmail?.emailVerifiedAt &&
          !matchingEmail.deletedAt
            ? matchingEmail
            : null);
        if (linkableEmail?.googleSub && linkableEmail.googleSub !== sub) {
          return false;
        }
        dbUser = linkableEmail
          ? await db.user.update({
              where: { id: linkableEmail.id },
              data: {
                googleSub: sub,
              },
            })
          : await db.user.create({
              data: {
                googleSub: sub,
                email: emailVerified && !matchingEmail ? email : null,
                emailVerifiedAt:
                  emailVerified && !matchingEmail ? new Date() : null,
                firstName: name.firstName,
                lastName: name.lastName,
                studentProfile: { create: {} },
              },
            });
      }
      if (dbUser.deletedAt) return false;
      user.id = dbUser.id;
      user.email = dbUser.email;
      user.name = `${dbUser.firstName} ${dbUser.lastName}`.trim();
      user.role = dbUser.role;
      user.sessionVersion = dbUser.sessionVersion;
      await touchLastAuth(dbUser.id, new Date());
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user?.id) {
        token.userId = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion ?? 0;
        token.googleSub =
          account?.provider === "google"
            ? account.providerAccountId
            : token.googleSub;
        token.authenticatedAt = Date.now();
        token.checkedAt = Date.now();
        return token;
      }

      const requestedUserId =
        trigger === "update" &&
        typeof session?.user?.id === "string"
          ? session.user.id
          : null;
      if (
        requestedUserId &&
        requestedUserId !== token.userId &&
        token.userId &&
        token.googleSub
      ) {
        const [currentUser, requestedUser] = await Promise.all([
          db.user.findUnique({
            where: { id: token.userId },
            select: { deletedAt: true, googleSub: true },
          }),
          db.user.findUnique({
            where: { id: requestedUserId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              deletedAt: true,
              googleSub: true,
            },
          }),
        ]);
        if (
          currentUser?.deletedAt &&
          !currentUser.googleSub &&
          requestedUser &&
          !requestedUser.deletedAt &&
          requestedUser.googleSub === token.googleSub
        ) {
          token.userId = requestedUser.id;
          token.email = requestedUser.email;
          token.name =
            `${requestedUser.firstName} ${requestedUser.lastName}`.trim();
          token.role = requestedUser.role;
          token.checkedAt = Date.now();
          return token;
        }
      }

      if (!token.userId) return token;
      const checkedAt =
        typeof token.checkedAt === "number" ? token.checkedAt : 0;
      const stale = Date.now() - checkedAt >= 5 * 60 * 1000;
      // Always re-check sessionVersion so password/phone changes revoke other devices promptly.
      const dbUser = await db.user.findUnique({
        where: { id: token.userId },
        select: { role: true, deletedAt: true, sessionVersion: true, googleSub: true },
      });
      if (!dbUser || dbUser.deletedAt) return null;
      if (
        typeof token.sessionVersion === "number" &&
        dbUser.sessionVersion !== token.sessionVersion
      ) {
        return null;
      }
      if (stale) {
        token.role = dbUser.role;
        token.sessionVersion = dbUser.sessionVersion;
        if (dbUser.googleSub) token.googleSub = dbUser.googleSub;
        token.checkedAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId;
      session.user.role = token.role;
      session.user.sessionVersion = token.sessionVersion;
      session.user.authenticatedAt =
        typeof token.authenticatedAt === "number"
          ? new Date(token.authenticatedAt).toISOString()
          : undefined;
      session.user.googleLinked = Boolean(token.googleSub);
      return session;
    },
  },
});
