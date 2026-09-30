import { Prisma } from "@prisma/client";

export function isBookingExclusionViolation(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = error.meta as {
      code?: string;
      database_error?: string;
      message?: string;
    } | null;
    if (
      meta?.code === "23P01" ||
      meta?.database_error?.includes("23P01") ||
      meta?.database_error?.includes("booking_no_overlap") ||
      meta?.message?.includes("booking_no_overlap")
    ) {
      return true;
    }
  }

  return (
    error instanceof Error &&
    (error.message.includes("23P01") ||
      error.message.includes("booking_no_overlap"))
  );
}

export function isSerializationOrTxTimeout(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2034" || error.code === "P2028")
  );
}

export function isUniqueViolationOn(error: unknown, model: string) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const meta = error.meta as {
    modelName?: unknown;
    target?: unknown;
  } | null;
  if (meta?.modelName === model) return true;

  const needles = [`${model}_pkey`, model];
  const target = meta?.target;
  if (typeof target === "string") {
    return needles.some((needle) => target.includes(needle));
  }
  if (Array.isArray(target)) {
    return target.some(
      (entry) =>
        typeof entry === "string" &&
        needles.some((needle) => entry.includes(needle)),
    );
  }
  return false;
}
