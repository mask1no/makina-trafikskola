import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireStudent(locale: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/${locale}/logga-in?callbackUrl=${encodeURIComponent(`/${locale}/mina-sidor`)}`,
    );
  }
  if (session.user.role !== "STUDENT") redirect(`/${locale}`);
  return session.user.id;
}
