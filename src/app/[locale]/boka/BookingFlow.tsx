"use client";

import { useEffect, useMemo, useReducer } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { getCancellationDeadline } from "@/lib/bookings/cancellation";
import {
  formatDate,
  formatDeadline,
  formatLessonTime,
} from "@/lib/format/datetime";
import { Card } from "@/components/Card";
import { CheckboxField } from "@/components/CheckboxField";
import { Notice } from "@/components/Notice";
import { Stepper } from "@/components/Stepper";

import { AccountStep } from "./steps/AccountStep";
import { addCalendarDays, localDateKey } from "./steps/dates";
import {
  bookingReducer,
  initialBookingState,
  type Booking,
  type Location,
  type Product,
  type Slot,
  type Teacher,
} from "./steps/state";
import { WhatStep } from "./steps/WhatStep";
import { WhenStep } from "./steps/WhenStep";
import { WhereStep } from "./steps/WhereStep";
import { WhoStep } from "./steps/WhoStep";

type Props = {
  locale: string;
  products: Product[];
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
  const languageNames = useTranslations("language");
  const [state, dispatch] = useReducer(
    bookingReducer,
    { locale, locations, teachers, initialTeacherId, initiallyAuthenticated },
    initialBookingState,
  );
  const patch = (patch: Partial<typeof state>) => dispatch({ type: "patch", patch });

  const selectedProduct = products.find((product) =>
    state.kind === "test"
      ? product.kind === "TEST_LESSON"
      : product.kind === "SINGLE_LESSON",
  );
  const lessonMinutes = selectedProduct?.lessonMinutes ?? 50;
  const filteredTeachers = useMemo(
    () =>
      teachers
        .filter((teacher) => teacher.languages.includes(state.language))
        .filter(
          (teacher) =>
            state.placeMode === "pickup" ||
            !state.locationId ||
            teacher.locationIds.includes(state.locationId),
        ),
    [state.language, state.locationId, state.placeMode, teachers],
  );
  const allLanguages = useMemo(
    () => Array.from(new Set(teachers.flatMap((teacher) => teacher.languages))),
    [teachers],
  );
  const teacherMarkers = filteredTeachers.flatMap((teacher) =>
    teacher.markers.map((position, index) => ({
      id: `${teacher.id}-${index}`,
      teacherId: teacher.id,
      title: teacher.name,
      position,
      languages: teacher.languages.map((language) =>
        languageNames.has(language) ? languageNames(language) : language,
      ),
    })),
  );

  useEffect(() => {
    if (state.kind !== "credits" || !state.authenticated) return;
    const controller = new AbortController();
    dispatch({ type: "patch", patch: { loadingCredits: true } });
    fetch("/api/me/credits", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
        dispatch({ type: "patch", patch: { creditBalance: Number(payload.balance) || 0 } });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        dispatch({
          type: "patch",
          patch: { error: reason instanceof Error ? reason.message : "UNKNOWN" },
        });
      })
      .finally(() => dispatch({ type: "patch", patch: { loadingCredits: false } }));
    return () => controller.abort();
  }, [dispatch, state.authenticated, state.kind]);

  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
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
    if (state.step !== 3 || !state.teacherId) return;
    const controller = new AbortController();
    const from = new Date();
    const to = addCalendarDays(from, 14);
    dispatch({ type: "patch", patch: { loadingSlots: true, error: "" } });
    fetch(
      `/api/availability?teacherId=${encodeURIComponent(state.teacherId)}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&lessonMinutes=${lessonMinutes}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
        return payload as Slot[];
      })
      .then((available) => {
        const firstDate = available[0]
          ? localDateKey(available[0].startsAt)
          : dates[0]?.key ?? "";
        dispatch({
          type: "patch",
          patch: {
            slots: available,
            selectedDate: firstDate,
            selectedSlot: available[0]?.startsAt ?? "",
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
  }, [dates, dispatch, lessonMinutes, state.step, state.teacherId]);

  const dateSlots = state.slots.filter(
    (slot) => localDateKey(slot.startsAt) === state.selectedDate,
  );
  const selectedTeacher = teachers.find((teacher) => teacher.id === state.teacherId);
  const selectedLocation = locations.find((location) => location.id === state.locationId);
  const selectedDateLabel = state.selectedSlot
    ? formatDate(new Date(state.selectedSlot), locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  function next() {
    patch({ error: "" });
    if (state.step === 1 && state.placeMode === "pickup" && state.pickupAddress.trim().length < 3) {
      patch({ error: "SELECT_LOCATION_OR_PICKUP" });
      return;
    }
    if (state.step === 2 && !state.teacherId) {
      patch({ error: "TEACHER_REQUIRED" });
      return;
    }
    if (state.step === 3) {
      if (!state.selectedSlot) {
        patch({ error: "SLOT_REQUIRED" });
        return;
      }
      if (state.authenticated) {
        void createBooking();
        return;
      }
    }
    dispatch({ type: "step", update: (current) => Math.min(4, current + 1) });
  }

  async function createBooking(authenticatedNow = false) {
    if (!authenticatedNow && !state.authenticated && !initiallyAuthenticated) {
      dispatch({ type: "step", update: () => 4 });
      return;
    }
    if (!state.selectedSlot) {
      patch({ error: "SLOT_REQUIRED" });
      return;
    }
    patch({ busy: true, error: "" });
    try {
      if (state.kind === "credits") {
        const creditsResponse = await fetch("/api/me/credits");
        const creditsPayload = await creditsResponse.json();
        if (!creditsResponse.ok) {
          throw new Error(creditsPayload.error?.code ?? "UNKNOWN");
        }
        const balance = Number(creditsPayload.balance) || 0;
        patch({ creditBalance: balance });
        if (balance < 1) throw new Error("NO_CREDITS");
      }
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          teacherId: state.teacherId,
          startsAt: state.selectedSlot,
          lessonMinutes,
          requireCredit: state.kind === "credits",
          ...(state.placeMode === "school"
            ? { locationId: state.locationId }
            : {
                pickupAddress: state.pickupAddress.trim(),
                ...(state.pickupCoordinates
                  ? {
                      pickupLat: state.pickupCoordinates.lat,
                      pickupLng: state.pickupCoordinates.lng,
                    }
                  : {}),
              }),
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
      <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-card">
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
                  disabled={
                    state.busy || !state.termsAccepted || !state.withdrawalAcknowledged
                  }
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
          <p
            role="alert"
            className="mt-4 rounded-sm border border-danger p-3 text-sm text-danger"
          >
            {errors.has(state.error) ? errors(state.error) : errors("UNKNOWN")}
          </p>
        ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 md:gap-6">
      <header className="max-w-2xl">
        <p className="hidden text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted md:block">{t("eyebrow")}</p>
        <h1 className="text-2xl font-black tracking-tight md:mt-3 md:text-4xl">{t("title")}</h1>
        <p className="mt-3 hidden leading-7 text-ink-muted md:block">{t("description")}</p>
      </header>
      <Stepper
        steps={[
          t("step.what.short"),
          t("step.where.short"),
          t("step.who.short"),
          t("step.when.short"),
          t("account.short"),
        ]}
        current={state.step}
        completed={state.authenticated ? [4] : []}
        progressLabel={t("progress")}
      />
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
      {state.step === 0 ? (
        <WhatStep
          products={products}
          kind={state.kind}
          loadingCredits={state.loadingCredits}
          creditBalance={state.creditBalance}
          onKind={(kind) => patch({ kind })}
        />
      ) : null}
      {state.step === 1 ? (
        <WhereStep
          locations={locations}
          placeMode={state.placeMode}
          locationId={state.locationId}
          pickupAddress={state.pickupAddress}
          mapApiKey={mapApiKey}
          onPlaceMode={(placeMode) => patch({ placeMode })}
          onLocationId={(locationId) => patch({ locationId })}
          onPickup={(pickupAddress, pickupCoordinates) =>
            patch({ pickupAddress, pickupCoordinates })
          }
        />
      ) : null}
      {state.step === 2 ? (
        <WhoStep
          locations={locations}
          language={state.language}
          languages={allLanguages}
          view={state.view}
          teachers={filteredTeachers}
          teacherId={state.teacherId}
          markers={teacherMarkers}
          mapApiKey={mapApiKey}
          mapId={mapId}
          onLanguage={(language) => patch({ language })}
          onView={(view) => patch({ view })}
          onTeacher={(teacherId) => patch({ teacherId })}
        />
      ) : null}
      {state.step === 3 ? (
        <WhenStep
          slots={state.slots}
          dates={dates}
          selectedDate={state.selectedDate}
          selectedSlot={state.selectedSlot}
          loadingSlots={state.loadingSlots}
          dateSlots={dateSlots}
          locale={locale}
          onFirstAvailable={(slot) =>
            patch({
              selectedDate: localDateKey(slot.startsAt),
              selectedSlot: slot.startsAt,
            })
          }
          onDate={(selectedDate) => patch({ selectedDate, selectedSlot: "" })}
          onSlot={(selectedSlot) => patch({ selectedSlot })}
        />
      ) : null}
      {state.step === 4 ? (
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
        <p role="alert" className="rounded-sm border border-danger p-3 text-sm text-danger">
          {errors.has(state.error) ? errors(state.error) : errors("UNKNOWN")}
        </p>
      ) : null}
      {state.step < 4 ? (
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex gap-3 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-soft sm:-mx-6 sm:px-6 md:static md:bottom-auto md:mx-0 md:mt-2 md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
        {state.step > 0 ? (
          <Button variant="tertiary" onClick={() => dispatch({ type: "step", update: (current) => current - 1 })}>
            {t("back")}
          </Button>
        ) : null}
        {state.step < 3 ? (
          <Button className="ms-auto" onClick={next}>
            {t("next")}
          </Button>
        ) : (
          <Button className="ms-auto" disabled={state.busy || !state.selectedSlot} onClick={next}>
            {state.authenticated ? t("confirm") : t("next")}
          </Button>
        )}
      </div>
      ) : null}
      </div>
      <aside className="hidden border-s border-border ps-8 lg:sticky lg:top-24 lg:block">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">{t("summary.eyebrow")}</p>
          <h2 className="mt-2 text-xl font-black">{t("summary.title")}</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div className="border-b border-border pb-4"><dt className="text-ink-muted">{t("summary.lesson")}</dt><dd className="mt-1 font-bold">{t(`step.what.${state.kind}`)}</dd></div>
            <div className="border-b border-border pb-4"><dt className="text-ink-muted">{t("summary.place")}</dt><dd className="mt-1 font-bold">{state.placeMode === "school" ? selectedLocation?.name ?? t("summary.notSelected") : state.pickupAddress || t("summary.notSelected")}</dd></div>
            <div className="border-b border-border pb-4"><dt className="text-ink-muted">{t("summary.teacher")}</dt><dd className="mt-1 font-bold">{selectedTeacher?.name ?? t("summary.notSelected")}</dd></div>
            <div><dt className="text-ink-muted">{t("summary.time")}</dt><dd className="mt-1 font-bold">{state.selectedSlot ? <><bdi>{selectedDateLabel}</bdi><bdi dir="ltr" className="block">{formatLessonTime(new Date(state.selectedSlot), locale)}</bdi></> : t("summary.notSelected")}</dd></div>
          </dl>
          <p className="mt-5 text-sm leading-6 text-ink-muted">{t("summary.reassurance")}</p>
      </aside>
      </div>
    </div>
  );
}
