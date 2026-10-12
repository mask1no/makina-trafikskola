import { db } from "@/lib/db";

/** Bump sessionVersion so other JWTs fail the next auth refresh check. */
export async function bumpSessionVersion(userId: string, now: Date = new Date()) {
  return db.user.update({
    where: { id: userId },
    data: {
      sessionVersion: { increment: 1 },
      updatedAt: now,
    },
    select: { sessionVersion: true },
  });
}

export async function touchLastAuth(userId: string, now: Date = new Date()) {
  await db.user.update({
    where: { id: userId },
    data: { lastAuthAt: now },
  });
}
