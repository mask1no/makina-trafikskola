import { getTranslations } from "next-intl/server";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";

import { ReviewActions } from "./ReviewActions";

export const dynamic = "force-dynamic";

export default async function ReviewsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const [t, reviews] = await Promise.all([
    getTranslations("admin.reviews"),
    db.review.findMany({
      where: { published: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        student: { select: { firstName: true, lastName: true } },
        teacher: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
  ]);
  const dateFormatter = new Intl.DateTimeFormat(params.locale, {
    timeZone: "Europe/Stockholm",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mt-8 grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-ink-muted">{t("student")}</dt>
                <dd className="mt-1 font-bold">
                  {review.student.firstName} {review.student.lastName}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-muted">{t("instructor")}</dt>
                <dd className="mt-1 font-bold">
                  {review.teacher.user.firstName} {review.teacher.user.lastName}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-muted">{t("rating")}</dt>
                <dd className="mt-1 font-bold numbers-ltr">{review.rating}/5</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-muted">{t("date")}</dt>
                <dd className="mt-1">{dateFormatter.format(review.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-ink-muted">{t("comment")}</dt>
                <dd className="mt-1 leading-6">{review.comment || t("noComment")}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <ReviewActions reviewId={review.id} />
            </div>
          </Card>
        ))}
        {!reviews.length ? (
          <EmptyState title={t("empty")} description={t("description")} />
        ) : null}
      </div>
    </section>
  );
}
