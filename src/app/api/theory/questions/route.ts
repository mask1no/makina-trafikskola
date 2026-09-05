import { z } from "zod";

import { auth } from "@/auth";
import { invalidInput } from "@/lib/api/http";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { hasTheoryAccess, presentQuestion } from "@/lib/theory/access";

const querySchema = z
  .object({
    category: z.string().trim().min(1).max(100).optional(),
    mode: z.enum(["study", "exam"]).default("study"),
    locale: z.enum(locales).default("sv"),
  })
  .strict();

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const session = await auth();
  const now = new Date();
  const paid =
    session?.user?.role === "STUDENT" &&
    Boolean(session.user.id) &&
    (await hasTheoryAccess(db, session.user.id, now));

  const questions = await db.theoryQuestion.findMany({
    where: {
      active: true,
      ...(!paid ? { isFree: true } : {}),
      ...(parsed.data.category
        ? { category: { slug: parsed.data.category } }
        : {}),
    },
    orderBy: [
      { category: { order: "asc" } },
      { difficulty: "asc" },
      { createdAt: "asc" },
    ],
    take: parsed.data.mode === "exam" ? 65 : 100,
    include: {
      translations: true,
      category: { include: { translations: true } },
      answers: {
        orderBy: { order: "asc" },
        include: { translations: true },
      },
    },
  });

  return Response.json({
    mode: parsed.data.mode,
    access: paid ? "paid" : "free",
    questions: questions.flatMap((question) => {
      const presented = presentQuestion(question, parsed.data.locale);
      return presented ? [presented] : [];
    }),
  });
}
