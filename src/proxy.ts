import type { Role } from "@prisma/client";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const { auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.userId;
      session.user.role = token.role;
      return session;
    },
  },
});

function requiredRoles(pathname: string): readonly Role[] | null {
  if (/^\/(?:sv|en|ti|ar|so)\/admin(?:\/|$)/.test(pathname)) {
    return ["ADMIN"];
  }
  if (/^\/(?:sv|en|ti|ar|so)\/larare-portal(?:\/|$)/.test(pathname)) {
    return ["TEACHER", "ADMIN"];
  }
  if (/^\/(?:sv|en|ti|ar|so)\/mina-sidor(?:\/|$)/.test(pathname)) {
    return ["STUDENT"];
  }
  return null;
}

export default auth((request) => {
  const roles = requiredRoles(request.nextUrl.pathname);
  if (roles && !request.auth?.user) {
    const locale =
      request.nextUrl.pathname.split("/")[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/logga-in`, request.nextUrl);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (roles && request.auth?.user && !roles.includes(request.auth.user.role)) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "FORBIDDEN" } },
      { status: 403 },
    );
  }

  const pathnameLocale = request.nextUrl.pathname.split("/")[1];
  const locale = routing.locales.includes(
    pathnameLocale as (typeof routing.locales)[number],
  )
    ? pathnameLocale
    : routing.defaultLocale;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-makina-locale", locale);
  requestHeaders.set("x-makina-pathname", request.nextUrl.pathname);

  return handleI18nRouting(
    new NextRequest(request.url, { headers: requestHeaders }),
  );
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
