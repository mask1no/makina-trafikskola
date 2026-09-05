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
