import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { calculateAvailableCreditBalance } from "@/lib/credits/ledger";
import { formatStockholm } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";
import { db } from "@/lib/db";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

import { CreditAdjustmentForm } from "./CreditAdjustmentForm";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ q?: string; student?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const [t, allT, students] = await Promise.all([
    getTranslations("admin.students"),
    getTranslations(),
    db.user.findMany({
      where: {
        role: "STUDENT",
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 50,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        localePref: true,
      },
    }),
  ]);
  const selected = searchParams.student
    ? await db.user.findFirst({
        where: {
          id: searchParams.student,
          role: "STUDENT",
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          localePref: true,
          credits: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              delta: true,
              reason: true,
              orderItemId: true,
              expiresAt: true,
              note: true,
              createdAt: true,
            },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              totalOre: true,
              vatOre: true,
              createdAt: true,
              payment: {
                select: {
                  provider: true,
                  method: true,
                  amountOre: true,
                  refundedOre: true,
                  status: true,
                },
              },
            },
          },
        },
      })
    : null;
  const now = new Date();
  const balance = selected
    ? calculateAvailableCreditBalance(selected.credits, now).balance
    : 0;
  const formatStamp = (date: Date) =>
    formatStockholm(date, params.locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <section>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <form className="mt-6 flex max-w-2xl flex-wrap gap-3">
        <div className="min-w-64 flex-1">
          <Input
            id="student-search"
            name="q"
            label={t("searchLabel")}
            defaultValue={q}
          />
        </div>
        <Button
          type="submit"
          className="self-end"
        >
          {t("search")}
        </Button>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="rounded-md border border-border bg-card p-3">
          <h2 className="px-2 py-2 font-bold">
            {t("results", { count: String(students.length) })}
          </h2>
          <div className="mt-2 grid gap-1">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/${params.locale}/admin/students?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  student: student.id,
                })}`}
                className="min-h-11 rounded-sm px-3 py-2 hover:bg-page"
              >
                <span className="block font-bold">
                  {student.firstName} {student.lastName}
                </span>
                <span className="block text-sm text-ink-muted">
                  {student.email ?? t("noEmail")}
                </span>
              </Link>
            ))}
          </div>
          {!students.length ? (
            <p className="p-3 text-ink-muted">{t("empty")}</p>
          ) : null}
        </aside>

        {selected ? (
          <div className="grid gap-6">
            <article className="rounded-md border border-border bg-card p-5">
              <h2 className="text-2xl font-black">
                {selected.firstName} {selected.lastName}
              </h2>
              <p className="mt-1 text-ink-muted">
                {selected.email ?? t("noEmail")} ·{" "}
                {selected.localePref.toUpperCase()}
              </p>
              <div className="mt-5 max-w-sm"><StatCard label={t("balance")} value={balance} /></div>
              <CreditAdjustmentForm studentId={selected.id} />
            </article>

            <article className="rounded-md border border-border bg-card p-5">
              <h2 className="text-xl font-bold">{t("payments")}</h2>
              <div className="mt-4 grid gap-3">
                {selected.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-sm border border-border p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-bold" dir="ltr">
                        {formatPrice(order.totalOre, params.locale)}
                      </p>
                      <Badge tone={order.status === "PAID" ? "success" : order.status === "FAILED" ? "danger" : "neutral"}>
                        {t(`orderStatus.${order.status}`)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {formatStamp(order.createdAt)}
                    </p>
                    {order.payment ? (
                      <p className="mt-2 text-sm">
                        {t("paymentLine", {
                          provider: t(`provider.${order.payment.provider}`),
                          method:
                            order.payment.method &&
                            ["card", "swish", "klarna"].includes(
                              order.payment.method,
                            )
                              ? t(`method.${order.payment.method}`)
                              : t("unknownMethod"),
                          status: t(`paymentStatus.${order.payment.status}`),
                          refunded: formatPrice(
                            order.payment.refundedOre,
                            params.locale,
                          ),
                        })}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-ink-muted">
                        {t("noPayment")}
                      </p>
                    )}
                  </div>
                ))}
                {!selected.orders.length ? (
                  <p className="text-ink-muted">{t("noPayments")}</p>
                ) : null}
              </div>
            </article>

            <article className="rounded-md border border-border bg-card p-5">
              <h2 className="text-xl font-bold">{t("ledger")}</h2>
              <div className="mt-4 grid gap-3">
                {selected.credits.map((credit) => (
                  <div
                    key={credit.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-sm border border-border p-4"
                  >
                    <div>
                      <p className="font-bold">
                        {allT(`student.saldo.reasons.${credit.reason}`)}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {formatStamp(credit.createdAt)}
                      </p>
                      {credit.note ? (
                        <p className="mt-2 text-sm">{credit.note}</p>
                      ) : null}
                    </div>
                    <p className="text-xl font-black" dir="ltr">
                      {credit.delta > 0 ? "+" : ""}
                      {credit.delta}
                    </p>
                  </div>
                ))}
                {!selected.credits.length ? (
                  <p className="text-ink-muted">{t("noLedger")}</p>
                ) : null}
              </div>
            </article>
          </div>
        ) : (
          <EmptyState title={t("selectStudent")} description={t("description")} />
        )}
      </div>
    </section>
  );
}
