import type { DefaultSession } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { allowLoginAttempt, consumeOtp } from "@/lib/auth/otp-store";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string;
    role: Role;
  }
}

const passwordCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

const phoneCredentialsSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  code: z.string().regex(/^\d{6}$/),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
});

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "email-password",
      name: "Email and password",
      credentials: {
        email: { type: "email" },
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
            parsed.data.email,
            clientIp(request),
            now,
          ))
        ) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email, deletedAt: null },
        });
        if (
          !user?.passwordHash ||
          !(await bcrypt.compare(parsed.data.password, user.passwordHash))
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
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
          return null;
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

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId;
      session.user.role = token.role;
      return session;
    },
  },
});
