import { AuthorizationError } from "@/lib/auth/guards";

export function apiError(
  code: string,
  status: number,
  fields?: Record<string, string[] | undefined>,
) {
  return Response.json(
    { error: { code, message: code, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export function invalidInput(fields: Record<string, string[] | undefined>) {
  return apiError("INVALID_INPUT", 400, fields);
}

export function authorizationError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return apiError(error.code, error.status);
  }
  throw error;
}
