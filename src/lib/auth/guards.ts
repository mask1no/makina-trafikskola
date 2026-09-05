import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

export class AuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    public readonly status: 401 | 403,
  ) {
    super(code);
    this.name = "AuthorizationError";
  }
}

export function requireRole(
  session: Session | null,
  roles: readonly Role[],
): Session & { user: { id: string; role: Role } } {
  if (!session?.user?.id) {
    throw new AuthorizationError("UNAUTHENTICATED", 401);
  }

  if (!roles.includes(session.user.role)) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }

  return session;
}
