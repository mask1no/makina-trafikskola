"use client";

import { useEffect, useMemo, useReducer } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CheckboxField } from "@/components/CheckboxField";
import { Notice } from "@/components/Notice";
import { Stepper } from "@/components/Stepper";
import { pointInGeoJson } from "@/lib/areas/geo";
import { getCancellationDeadline } from "@/lib/bookings/cancellation";
import { formatDate, formatDeadline, formatLessonTime } from "@/lib/format/datetime";

import { AccountStep } from "./steps/AccountStep";
import { AreaStep } from "./steps/AreaStep";
import { addCalendarDays, localDateKey } from "./steps/dates";
import { GearboxStep } from "./steps/GearboxStep";
import { PayStep } from "./steps/PayStep";
import { PickupStep } from "./steps/PickupStep";
import { ScheduleStep } from "./steps/ScheduleStep";
import {
  bookingReducer,
  initialBookingState,
  type Booking,
  type Gearbox,
  type Location,
  type MeetMode,
  type PackageOffer,
  type Product,
  type Slot,
  type Teacher,
} from "./steps/state";

type Props = {
  locale: string;
  products: Product[];
  packages: PackageOffer[];
  locations: Location[];
  teachers: Teacher[];
  initialTeacherId?: string;
  initiallyAuthenticated: boolean;
  cancellationWindowHours: number;
  mapApiKey?: string;
  mapId?: string;
  googleEnabled?: boolean;
};

export function BookingFlow({
  locale,
  products,
  packages,
  locations,
  teachers,
  initialTeacherId,
  initiallyAuthenticated,
  cancellationWindowHours,
  mapApiKey,
  mapId,
  googleEnabled = false,
}: Props) {
  const t = useTranslations("booking");
  const errors = useTranslations("errors");
  const [state, dispatch] = useReducer(
    bookingReducer,
    { locale, locations, teachers, initialTeacherId, initiallyAuthenticated },
    initialBookingState,
  );
  const patch = (next: Partial<typeof state>) => dispatch({ type: "patch", patch: next });
  const selectedProduct = products.find((product) => product.kind === "SINGLE_LESSON");
  const lessonMinutes = selectedProduct?.lessonMinutes === 100 ? 100 : 50;
  const selectedArea = locations.find((location) => location.id === state.areaId);
  const filteredTeachers = useMemo(
    () =>
      teachers.filter(
        (teacher) =>
          teacher.locationIds.includes(state.areaId) &&
          state.gearbox !== "" &&
          teacher.transmissions.includes(state.gearbox),
      ),
    [state.areaId, state.gearbox, teachers],
  );
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addCalendarDays(new Date(), index);
      return {
        key: localDateKey(date.toISOString()),
        label: formatDate(date, locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      };
    });
  }, [locale]);

  useEffect(() => {
    if (state.step !== 3 || !filteredTeachers.length) return;
    const controller = new AbortController();
    const from = new Date();
    const to = addCalendarDays(from, 14);
    dispatch({ type: "patch", patch: { loadingSlots: true, error: "" } });
    Promise.all(
      filteredTeachers.map(async (teacher) => {
        const response = await fetch(
          `/api/availability?teacherId=${encodeURIComponent(teacher.id)}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&lessonMinutes=${lessonMinutes}`,
          { signal: controller.signal },
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
        return [teacher.id, payload as Slot[]] as const;
      }),
    )
      .then((entries) => {
        const previews = Object.fromEntries(entries);
        const first = previews[state.teacherId]?.[0] ?? entries[0]?.[1][0];
        dispatch({
          type: "patch",
          patch: {
            previews,
            selectedDate: first ? localDateKey(first.startsAt) : dates[0]?.key ?? "",
          },
        });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        dispatch({
          type: "patch",
          patch: { error: reason instanceof Error ? reason.message : "UNKNOWN" },
        });
      })
      .finally(() => dispatch({ type: "patch", patch: { loadingSlots: false } }));
    return () => controller.abort();
  }, [dates, filteredTeachers, lessonMinutes, state.step, state.teacherId]);

  const selectedTeacher = teachers.find((teacher) => teacher.id === state.teacherId);
  const selectedDateLabel = state.selectedSlot
    ? formatDate(new Date(state.selectedSlot), locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  function next() {
    patch({ error: "" });
    if (state.step === 0) {
      if (!selectedArea || selectedArea.status !== "ACTIVE") {
        patch({ error: "AREA_UNAVAILABLE" });
        return;
      }
    }
    if (state.step === 1 && state.meet === "pickup") {
      if (!state.pickupCoordinates) {
        patch({ error: "PICKUP_ADDRESS_CONFIRMATION_REQUIRED" });
        return;
      }
      if (
        selectedArea?.boundary &&
        !pointInGeoJson(
          { lng: state.pickupCoordinates.lng, lat: state.pickupCoordinates.lat },
          selectedArea.boundary,
        )
      ) {
        patch({ error: "OUTSIDE_PICKUP_AREA" });
        return;
      }
    }
    if (state.step === 2 && !state.gearbox) {
      patch({ error: "TEACHER_REQUIRED" });
      return;
    }
    if (state.step === 3 && !state.selectedSlot) {
      patch({ error: "SLOT_REQUIRED" });
      return;
    }
    if (state.step === 4) {
      if (state.authenticated) {
        void createBooking();
        return;
      }
      dispatch({ type: "step", update: () => 5 });
      return;
    }
    dispatch({ type: "step", update: (current) => Math.min(5, current + 1) });
  }

  async function createBooking(authenticatedNow = false) {
    if (!authenticatedNow && !state.authenticated && !initiallyAuthenticated) {
      dispatch({ type: "step", update: () => 5 });
      return;
    }
    if (!state.selectedSlot || !state.areaId) {
      patch({ error: "SLOT_REQUIRED" });
      return;
    }
    patch({ busy: true, error: "" });
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          teacherId: state.teacherId,
          startsAt: state.selectedSlot,
          lessonMinutes,
          locationId: state.areaId,
          transmission: state.gearbox,
          ...(state.meet === "pickup"
            ? {
                pickupAddress: state.pickupAddress.trim(),
                pickupLat: state.pickupCoordinates?.lat,
                pickupLng: state.pickupCoordinates?.lng,
              }
            : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
      patch({ booking: payload as Booking });
    } catch (reason) {
      patch({ error: reason instanceof Error ? reason.message : "UNKNOWN" });
    } finally {
      patch({ busy: false });
    }
  }

  async function startCheckout() {
    if (!state.booking || !selectedProduct) return;
    if (!state.termsAccepted || !state.withdrawalAcknowledged) {
      patch({ error: "CHECKOUT_CONSENT_REQUIRED" });
      return;
    }
    patch({ busy: true, error: "" });
    try {
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: 1,
          bookingId: state.booking.id,
          termsAccepted: state.termsAccepted,
          withdrawalAcknowledged: state.withdrawalAcknowledged,
        }),
      });
      const checkout = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        if (checkout.error?.code === "PRODUCT_INACTIVE") {
          patch({ paymentUnavailable: true });
          return;
        }
        throw new Error(checkout.error?.code ?? "UNKNOWN");
      }
      if (checkout.url) window.location.assign(checkout.url);
    } catch (reason) {
      patch({ error: reason instanceof Error ? reason.message : "UNKNOWN" });
    } finally {
      patch({ busy: false });
    }
  }

  if (state.booking) {
    const deadline = getCancellationDeadline(
      new Date(state.booking.startsAt),
      cancellationWindowHours,
    );
    const deadlineLabel = formatDeadline(deadline, locale);
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-[var(--line)] bg-card shadow-card">
        <div className="bg-surface px-6 py-8 text-ink-inverse sm:px-10 sm:py-10">
          <div className="grid size-12 place-items-center rounded-full bg-success text-xl font-black" aria-hidden="true">✓</div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-ink-inverse/70">{t("confirmation.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{t("confirmation.title")}</h1>
        </div>
        <div className="p-6 sm:p-10">
          <p className="mt-3 break-words text-ink-muted">
            {t.rich("confirmation.deadline", {
              deadline: deadlineLabel,
              time: (chunks) => <bdi>{chunks}</bdi>,
            })}
          </p>
          <a
            href={`/api/bookings/${state.booking.id}/calendar`}
            className="mt-5 inline-flex min-h-11 items-center rounded-sm border border-border bg-card px-5 font-bold shadow-soft hover:border-border-strong"
          >
            {t("confirmation.calendar")}
          </a>
          {state.booking.creditCharged ? (
            <Notice className="mt-5" tone="success">{t("confirmation.creditUsed")}</Notice>
          ) : (
            <>
              <Notice className="mt-5">
                {t.rich("confirmation.hold", {
                  expires: state.booking.holdExpiresAt
                    ? formatLessonTime(new Date(state.booking.holdExpiresAt), locale)
                    : "",
                  time: (chunks) => <bdi>{chunks}</bdi>,
                })}
              </Notice>
              {!state.paymentUnavailable ? (
                <Card className="mt-5" elevated>
                  <p className="font-bold">{t("checkout.title")}</p>
                  <div className="mt-4 grid gap-3">
                    <CheckboxField
                      id="booking-terms"
                      label={t("checkout.termsConsent")}
                      checked={state.termsAccepted}
                      onChange={(event) => patch({ termsAccepted: event.target.checked })}
                    />
                    <CheckboxField
                      id="booking-withdrawal"
                      label={t("checkout.withdrawalConsent")}
                      checked={state.withdrawalAcknowledged}
                      onChange={(event) =>
                        patch({ withdrawalAcknowledged: event.target.checked })
                      }
                    />
                  </div>
                  <Button
                    className="mt-4 w-full"
                    disabled={state.busy || !state.termsAccepted || !state.withdrawalAcknowledged}
                    onClick={startCheckout}
                  >
                    {t("checkout.continue")}
                  </Button>
                </Card>
              ) : null}
            </>
          )}
          {state.paymentUnavailable ? <Notice className="mt-4">{t("confirmation.provisional")}</Notice> : null}
          {state.error ? (
            <p role="alert" className="mt-4 rounded-sm border border-danger p-3 text-sm text-danger">
              {errors.has(state.error) ? errors(state.error) : errors("UNKNOWN")}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  const placeLabel =
    state.meet === "office"
      ? selectedArea?.officeAddress || selectedArea?.name
      : state.pickupAddress;

  return (
    <div className="grid min-w-0 gap-4 md:gap-6">
      <header className="max-w-2xl">
        <p className="hidden text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted md:block">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black tracking-tight md:mt-3 md:text-4xl">{t("title")}</h1>
        <p className="mt-3 hidden leading-7 text-ink-muted md:block">{t("description")}</p>
      </header>
      <Stepper
        steps={[
          t("step.area.short"),
          t("step.pickup.short"),
          t("step.gearbox.short"),
          t("step.schedule.short"),
          t("step.pay.short"),
          t("account.short"),
        ]}
        current={state.step}
        completed={state.authenticated ? [5] : []}
        progressLabel={t("progress")}
      />
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {state.step === 0 ? (
            <AreaStep
              locations={locations}
              areaId={state.areaId}
              onArea={(areaId) => patch({ areaId, teacherId: "", selectedSlot: "" })}
            />
          ) : null}
          {state.step === 1 ? (
            <PickupStep
              area={selectedArea}
              meet={state.meet}
              pickupAddress={state.pickupAddress}
              pickupCoordinates={state.pickupCoordinates}
              mapApiKey={mapApiKey}
              mapId={mapId}
              onMeet={(meet: MeetMode) => patch({ meet })}
              onPickupTyped={(value) => dispatch({ type: "pickupTyped", value })}
              onPickupSelected={(value, coordinates) =>
                dispatch({ type: "pickupSelected", value, coordinates })
              }
            />
          ) : null}
          {state.step === 2 ? (
            <GearboxStep
              gearbox={state.gearbox}
              onGearbox={(gearbox: Gearbox) => patch({ gearbox, teacherId: "", selectedSlot: "" })}
            />
          ) : null}
          {state.step === 3 ? (
            <ScheduleStep
              teachers={filteredTeachers}
              teacherId={state.teacherId}
              previews={state.previews}
              dates={dates}
              selectedDate={state.selectedDate}
              selectedSlot={state.selectedSlot}
              loading={state.loadingSlots}
              weekOpen={state.weekOpen}
              locale={locale}
              onTeacher={(teacherId) => patch({ teacherId, selectedSlot: "" })}
              onWeek={(weekOpen) => patch({ weekOpen })}
              onDate={(selectedDate) => patch({ selectedDate })}
              onSlot={(selectedSlot) => patch({ selectedSlot })}
            />
          ) : null}
          {state.step === 4 ? <PayStep product={selectedProduct} packages={packages} /> : null}
          {state.step === 5 ? (
            <AccountStep
              locale={locale}
              googleEnabled={googleEnabled}
              onAuthenticated={async () => {
                patch({ authenticated: true });
                await createBooking(true);
              }}
            />
          ) : null}
          {state.error ? (
            <p role="alert" className="mt-4 rounded-sm border border-danger p-3 text-sm text-danger">
              {errors.has(state.error) ? errors(state.error) : errors("UNKNOWN")}
            </p>
          ) : null}
          {state.step < 5 ? (
            <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 mt-6 flex gap-3 border-t border-border bg-card px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:shadow-none">
              {state.step > 0 ? (
                <Button variant="secondary" onClick={() => dispatch({ type: "step", update: (current) => current - 1 })}>
                  {t("back")}
                </Button>
              ) : null}
              <Button className="ms-auto" disabled={state.busy} onClick={next}>
                {state.step === 4 && state.authenticated ? t("confirm") : t("next")}
              </Button>
            </div>
          ) : null}
        </div>
        <aside className="hidden border-s border-border ps-8 lg:sticky lg:top-24 lg:block">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">{t("summary.eyebrow")}</p>
          <h2 className="mt-2 text-xl font-black">{t("summary.title")}</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div className="border-b border-border pb-4">
              <dt className="text-ink-muted">{t("summary.place")}</dt>
              <dd className="mt-1 font-bold">{selectedArea?.city || t("summary.notSelected")}</dd>
            </div>
            <div className="border-b border-border pb-4">
              <dt className="text-ink-muted">{t("step.pickup.short")}</dt>
              <dd className="mt-1 font-bold">{placeLabel || t("summary.notSelected")}</dd>
            </div>
            <div className="border-b border-border pb-4">
              <dt className="text-ink-muted">{t("summary.teacher")}</dt>
              <dd className="mt-1 font-bold">{selectedTeacher?.name ?? t("summary.notSelected")}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{t("summary.time")}</dt>
              <dd className="mt-1 font-bold">
                {state.selectedSlot ? (
                  <>
                    <bdi>{selectedDateLabel}</bdi>
                    <bdi dir="ltr" className="block">{formatLessonTime(new Date(state.selectedSlot), locale)}</bdi>
                  </>
                ) : (
                  t("summary.notSelected")
                )}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
