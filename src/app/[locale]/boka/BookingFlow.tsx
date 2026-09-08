"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CheckboxField } from "@/components/CheckboxField";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";
import { SlotChip } from "@/components/SlotChip";
import { Stepper } from "@/components/Stepper";
import { TeacherMap } from "@/components/TeacherMap";

const PickupAddressAutocomplete = dynamic(
  () => import("@/components/PickupAddressAutocomplete"),
  { ssr: false },
);

type Product = {
  id: string;
  kind: "SINGLE_LESSON" | "TEST_LESSON";
  active: boolean;
  lessonMinutes: number;
  name: string;
};

type Location = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type Teacher = {
  id: string;
  name: string;
  languages: string[];
  locationIds: string[];
  markers: { lat: number; lng: number }[];
};

type Slot = { startsAt: string; endsAt: string };
type Booking = {
  id: string;
  startsAt: string;
  holdExpiresAt: string | null;
  creditCharged: boolean;
};

type Props = {
  locale: string;
  products: Product[];
  locations: Location[];
  teachers: Teacher[];
  initialTeacherId?: string;
  initiallyAuthenticated: boolean;
  cancellationWindowHours: number;
  mapApiKey?: string;
};

function localDateKey(value: string, timeZone = "Europe/Stockholm") {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function addCalendarDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function BookingFlow({
  locale,
  products,
  locations,
  teachers,
  initialTeacherId,
  initiallyAuthenticated,
  cancellationWindowHours,
  mapApiKey,
}: Props) {
  const t = useTranslations("booking");
  const errors = useTranslations("errors");
  const languageNames = useTranslations("language");
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"single" | "credits" | "test">("single");
  const [placeMode, setPlaceMode] = useState<"school" | "pickup">("school");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const initialTeacher = teachers.find(
    (teacher) => teacher.id === initialTeacherId,
  );
  const [language, setLanguage] = useState(
    initialTeacher?.languages.includes(locale)
      ? locale
      : initialTeacher?.languages[0] ?? locale,
  );
  const [teacherId, setTeacherId] = useState(initialTeacherId ?? "");
  const [view, setView] = useState<"list" | "map">("list");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated);
  const [otpRequested, setOtpRequested] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [withdrawalAcknowledged, setWithdrawalAcknowledged] = useState(false);

  const selectedProduct = products.find((product) =>
    kind === "test"
      ? product.kind === "TEST_LESSON"
      : product.kind === "SINGLE_LESSON",
  );
  const lessonMinutes = selectedProduct?.lessonMinutes ?? 50;
  const filteredTeachers = useMemo(
    () =>
      teachers
        .filter((teacher) => teacher.languages.includes(language))
        .filter(
          (teacher) =>
            placeMode === "pickup" ||
            !locationId ||
            teacher.locationIds.includes(locationId),
        ),
    [language, locationId, placeMode, teachers],
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
    })),
  );

  useEffect(() => {
    if (kind !== "credits" || !authenticated) return;
    const controller = new AbortController();
    // This loading state intentionally tracks the external request lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingCredits(true);
    fetch("/api/me/credits", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
        setCreditBalance(Number(payload.balance) || 0);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "UNKNOWN");
      })
      .finally(() => setLoadingCredits(false));
    return () => controller.abort();
  }, [authenticated, kind]);

  const dates = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: "Europe/Stockholm",
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return Array.from({ length: 14 }, (_, index) => {
      const date = addCalendarDays(new Date(), index);
      return {
        key: localDateKey(date.toISOString()),
        label: formatter.format(date),
      };
    });
  }, [locale]);

  useEffect(() => {
    if (step !== 3 || !teacherId) return;
    const controller = new AbortController();
    const from = new Date();
    const to = addCalendarDays(from, 14);
    // These states intentionally reset when the external availability request changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    setError("");
    fetch(
      `/api/availability?teacherId=${encodeURIComponent(teacherId)}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&lessonMinutes=${lessonMinutes}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
        return payload as Slot[];
      })
      .then((available) => {
        setSlots(available);
        const firstDate = available[0]
          ? localDateKey(available[0].startsAt)
          : dates[0]?.key ?? "";
        setSelectedDate(firstDate);
        setSelectedSlot(available[0]?.startsAt ?? "");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "UNKNOWN");
      })
      .finally(() => setLoadingSlots(false));
    return () => controller.abort();
  }, [dates, lessonMinutes, step, teacherId]);

  const dateSlots = slots.filter(
    (slot) => localDateKey(slot.startsAt) === selectedDate,
  );
  const selectedTeacher = teachers.find((teacher) => teacher.id === teacherId);
  const selectedLocation = locations.find((location) => location.id === locationId);
  const selectedDateLabel = selectedSlot
    ? new Intl.DateTimeFormat(locale, {
        timeZone: "Europe/Stockholm",
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(selectedSlot))
    : "";
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  });

  function next() {
    setError("");
    if (step === 1 && placeMode === "pickup" && pickupAddress.trim().length < 3) {
      setError("SELECT_LOCATION_OR_PICKUP");
      return;
    }
    if (step === 2 && !teacherId) {
      setError("TEACHER_REQUIRED");
      return;
    }
    if (step === 3) {
      if (!selectedSlot) {
        setError("SLOT_REQUIRED");
        return;
      }
      if (authenticated) {
        void createBooking();
        return;
      }
    }
    setStep((current) => Math.min(4, current + 1));
  }

  async function requestOtp() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload =
        response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setDevCode(payload?.devCode ?? "");
      setOtpRequested(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code, firstName, lastName }),
      });
      const payload =
        response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "INVALID_OTP");
      setAuthenticated(true);
      await createBooking(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function createBooking(authenticatedNow = false) {
    if (!authenticatedNow && !authenticated && !initiallyAuthenticated) {
      setStep(4);
      return;
    }
    if (!selectedSlot) {
      setError("SLOT_REQUIRED");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (kind === "credits") {
        const creditsResponse = await fetch("/api/me/credits");
        const creditsPayload = await creditsResponse.json();
        if (!creditsResponse.ok) {
          throw new Error(creditsPayload.error?.code ?? "UNKNOWN");
        }
        const balance = Number(creditsPayload.balance) || 0;
        setCreditBalance(balance);
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
          teacherId,
          startsAt: selectedSlot,
          lessonMinutes,
          requireCredit: kind === "credits",
          ...(placeMode === "school"
            ? { locationId }
            : {
                pickupAddress: pickupAddress.trim(),
                ...(pickupCoordinates
                  ? {
                      pickupLat: pickupCoordinates.lat,
                      pickupLng: pickupCoordinates.lng,
                    }
                  : {}),
              }),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
      const created = payload as Booking;
      setBooking(created);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function startCheckout() {
    if (!booking || !selectedProduct) return;
    if (!termsAccepted || !withdrawalAcknowledged) {
      setError("CHECKOUT_CONSENT_REQUIRED");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: 1,
          bookingId: booking.id,
          termsAccepted,
          withdrawalAcknowledged,
        }),
      });
      const checkout = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        if (checkout.error?.code === "PRODUCT_INACTIVE") {
          setPaymentUnavailable(true);
          return;
        }
        throw new Error(checkout.error?.code ?? "UNKNOWN");
      }
      if (checkout.url) window.location.assign(checkout.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  if (booking) {
    const deadline = new Date(
      new Date(booking.startsAt).getTime() -
        cancellationWindowHours * 60 * 60 * 1000,
    );
    const deadlineLabel = new Intl.DateTimeFormat(locale, {
      timeZone: "Europe/Stockholm",
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(deadline);
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="bg-surface px-6 py-8 text-ink-inverse sm:px-10 sm:py-10">
          <div className="grid size-12 place-items-center rounded-full bg-success text-xl font-black" aria-hidden="true">✓</div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-ink-inverse/70">{t("confirmation.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{t("confirmation.title")}</h1>
        </div>
        <div className="p-6 sm:p-10">
        <p className="mt-3 text-ink-muted">
          {t("confirmation.deadline", { deadline: deadlineLabel })}
        </p>
        <a
          href={`/api/bookings/${booking.id}/calendar`}
          className="mt-5 inline-flex min-h-11 items-center rounded-sm border border-border bg-card px-5 font-bold shadow-soft hover:border-border-strong"
        >
          {t("confirmation.calendar")}
        </a>
        {booking.creditCharged ? (
            <Notice className="mt-5" tone="success">{t("confirmation.creditUsed")}</Notice>
        ) : (
          <>
            <Notice className="mt-5">
              {t("confirmation.hold", {
                expires: booking.holdExpiresAt
                  ? timeFormatter.format(new Date(booking.holdExpiresAt))
                  : "",
              })}
            </Notice>
            {!paymentUnavailable ? (
              <Card className="mt-5" elevated>
                <p className="font-bold">{t("checkout.title")}</p>
                <p className="mt-2 text-sm text-ink-muted">{t("checkout.draft")}</p>
                <div className="mt-4 grid gap-3">
                  <CheckboxField
                    id="booking-terms"
                    label={t("checkout.termsConsent")}
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                  />
                  <CheckboxField
                    id="booking-withdrawal"
                    label={t("checkout.withdrawalConsent")}
                    checked={withdrawalAcknowledged}
                    onChange={(event) =>
                      setWithdrawalAcknowledged(event.target.checked)
                    }
                  />
                </div>
                <Button
                  className="mt-4 w-full"
                  disabled={
                    busy || !termsAccepted || !withdrawalAcknowledged
                  }
                  onClick={startCheckout}
                >
                  {t("checkout.continue")}
                </Button>
              </Card>
            ) : null}
          </>
        )}
        {paymentUnavailable ? <Notice className="mt-4">{t("confirmation.provisional")}</Notice> : null}
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-danger p-3 text-sm text-danger"
          >
            {errors.has(error) ? errors(error) : errors("UNKNOWN")}
          </p>
        ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="max-w-2xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 leading-7 text-ink-muted">{t("description")}</p>
      </header>
      <Stepper
        steps={[
          t("step.what.short"),
          t("step.where.short"),
          t("step.who.short"),
          t("step.when.short"),
          t("account.short"),
        ]}
        current={step}
        completed={authenticated ? [4] : []}
        progressLabel={t("progress")}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <Card padding="lg" elevated>

      {step === 0 ? (
        <section>
          <h1 className="text-3xl font-black">{t("step.what.title")}</h1>
          <p className="mt-2 text-ink-muted">{t("step.what.description")}</p>
          <div className="mt-6 grid gap-3">
            {(["single", "credits", "test"] as const).map((option) => {
              const product =
                option === "test"
                  ? products.find((item) => item.kind === "TEST_LESSON")
                  : products.find((item) => item.kind === "SINGLE_LESSON");
              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => setKind(option)}
                  aria-pressed={kind === option}
                  className={`min-h-24 rounded-md border p-5 text-start shadow-soft transition hover:-translate-y-0.5 hover:border-border-strong ${
                    kind === option ? "border-ink bg-card ring-2 ring-accent" : "border-border bg-card"
                  }`}
                >
                  <span className="font-bold">{t(`step.what.${option}`)}</span>
                  {option !== "credits" && product && !product.active ? (
                    <span className="mt-1 block text-sm text-ink-muted">
                      {t("provisional")}
                    </span>
                  ) : null}
                  {option === "credits" && kind === "credits" ? (
                    <span className="mt-1 block text-sm text-ink-muted">
                      {loadingCredits
                        ? t("credits.loading")
                        : creditBalance === null
                          ? t("credits.signIn")
                          : t("credits.balance", { count: creditBalance })}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section>
          <h1 className="text-3xl font-black">{t("step.where.title")}</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(["school", "pickup"] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setPlaceMode(mode)}
                aria-pressed={placeMode === mode}
                className={`min-h-28 rounded-md border p-5 text-start font-bold shadow-soft transition hover:-translate-y-0.5 hover:border-border-strong ${
                  placeMode === mode ? "border-ink bg-card ring-2 ring-accent" : "border-border bg-card"
                }`}
              >
                {t(`step.where.${mode}`)}
              </button>
            ))}
          </div>
          {placeMode === "school" ? (
            <div className="mt-5 grid gap-2">
              <label htmlFor="booking-location" className="text-sm font-semibold">
                {t("step.where.location")}
              </label>
              <select
                id="booking-location"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                className="min-h-11 rounded-sm border border-border bg-card px-4"
              >
                {locations.map((location) => (
                  <option value={location.id} key={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-5">
              {mapApiKey ? (
                <PickupAddressAutocomplete
                  apiKey={mapApiKey}
                  label={t("step.where.address")}
                  value={pickupAddress}
                  onChange={(value, coordinates) => {
                    setPickupAddress(value);
                    setPickupCoordinates(coordinates ?? null);
                  }}
                />
              ) : (
                <Input
                  label={t("step.where.address")}
                  value={pickupAddress}
                  onChange={(event) => {
                    setPickupAddress(event.target.value);
                    setPickupCoordinates(null);
                  }}
                  autoComplete="street-address"
                />
              )}
            </div>
          )}
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h1 className="text-3xl font-black">{t("step.who.title")}</h1>
          <fieldset className="mt-5">
            <legend className="font-bold">{t("step.who.languageFirst")}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {allLanguages.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setLanguage(item)}
                  aria-pressed={language === item}
                  className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                    language === item
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-border bg-card"
                  }`}
                >
                  {languageNames.has(item)
                    ? languageNames(item)
                    : item.toUpperCase()}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex gap-2">
            <Button variant={view === "list" ? "primary" : "tertiary"} onClick={() => setView("list")}>
              {t("step.who.list")}
            </Button>
            <Button variant={view === "map" ? "primary" : "tertiary"} onClick={() => setView("map")}>
              {t("step.who.map")}
            </Button>
          </div>
          {view === "map" && locations[0] ? (
            <div className="mt-5">
              <TeacherMap
                apiKey={mapApiKey}
                center={{ lat: locations[0].lat, lng: locations[0].lng }}
                label={t("step.who.mapLabel")}
                missingKeyTitle={t("step.who.mapUnavailable")}
                missingKeyDescription={t("step.who.mapUnavailableDescription")}
                markers={teacherMarkers}
                selectedTeacherId={teacherId}
                onSelectTeacher={setTeacherId}
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {filteredTeachers.map((teacher) => (
                <button
                  type="button"
                  key={teacher.id}
                  onClick={() => setTeacherId(teacher.id)}
                  aria-pressed={teacherId === teacher.id}
                  className={`min-h-20 rounded-md border bg-card p-5 text-start shadow-soft transition hover:border-border-strong ${
                    teacherId === teacher.id ? "border-ink ring-2 ring-accent" : "border-border"
                  }`}
                >
                  <span className="font-bold">{teacher.name}</span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {teacher.languages
                      .map((item) =>
                        languageNames.has(item) ? languageNames(item) : item,
                      )
                      .join(" · ")}
                  </span>
                </button>
              ))}
              {!filteredTeachers.length ? (
                <EmptyState title={t("step.who.emptyTitle")} description={t("step.who.empty")} />
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <h1 className="text-3xl font-black">{t("step.when.title")}</h1>
          {slots[0] ? (
            <button
              type="button"
              onClick={() => {
                setSelectedDate(localDateKey(slots[0].startsAt));
                setSelectedSlot(slots[0].startsAt);
              }}
              className="mt-5 flex min-h-14 w-full items-center justify-between rounded-md bg-surface px-4 text-start font-bold text-ink-inverse"
            >
              <span>{t("step.when.firstAvailable")}</span>
              <span dir="ltr">{timeFormatter.format(new Date(slots[0].startsAt))}</span>
            </button>
          ) : null}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {dates.map((date) => (
              <button
                type="button"
                key={date.key}
                onClick={() => {
                  setSelectedDate(date.key);
                  setSelectedSlot("");
                }}
                aria-pressed={selectedDate === date.key}
                className={`min-h-14 min-w-24 rounded-sm border px-3 text-sm ${
                  selectedDate === date.key
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-border bg-card"
                }`}
              >
                {date.label}
              </button>
            ))}
          </div>
          {loadingSlots ? (
            <div role="status" className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              <span className="sr-only">{t("step.when.loading")}</span>
              {Array.from({ length: 8 }, (_, index) => <span key={index} className="min-h-11 animate-pulse rounded-sm bg-page" />)}
            </div>
          ) : null}
          {!loadingSlots ? (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {dateSlots.map((slot) => (
                <SlotChip
                  key={slot.startsAt}
                  selected={selectedSlot === slot.startsAt}
                  onClick={() => setSelectedSlot(slot.startsAt)}
                >
                  <span dir="ltr">{timeFormatter.format(new Date(slot.startsAt))}</span>
                </SlotChip>
              ))}
            </div>
          ) : null}
          {!loadingSlots && !dateSlots.length ? (
            <div className="mt-5"><EmptyState title={t("step.when.emptyTitle")} description={t("step.when.empty")} /></div>
          ) : null}
        </section>
      ) : null}

      {step === 4 ? (
        <section>
          <h1 className="text-3xl font-black">{t("account.title")}</h1>
          <p className="mt-2 leading-7 text-ink-muted">
            {t("account.description")}
          </p>
          <div className="mt-6 grid gap-4">
            {!otpRequested ? (
              <>
                <Input label={t("account.firstName")} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
                <Input label={t("account.lastName")} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" />
                <Input label={t("account.phone")} value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" placeholder="+46…" />
              </>
            ) : (
              <Input label={t("account.code")} value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" />
            )}
          </div>
          {devCode ? (
            <p className="mt-3 rounded-sm bg-page p-3 text-sm">
              {t("account.devCode", { code: devCode })}
            </p>
          ) : null}
          <Button className="mt-5 w-full" disabled={busy} onClick={otpRequested ? verifyOtp : requestOtp}>
            {otpRequested ? t("account.verify") : t("account.send")}
          </Button>
          <Link
            href={`/${locale}/logga-in?next=${encodeURIComponent(`/${locale}/boka`)}`}
            className="mt-4 flex min-h-11 items-center justify-center text-sm font-bold underline underline-offset-4"
          >
            {t("account.emailLink")}
          </Link>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-sm border border-danger p-3 text-sm text-danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </p>
      ) : null}

      <div className="flex gap-3">
        {step > 0 ? (
          <Button variant="tertiary" onClick={() => setStep((current) => current - 1)}>
            {t("back")}
          </Button>
        ) : null}
        {step < 3 ? (
          <Button className="ms-auto" onClick={next}>
            {t("next")}
          </Button>
        ) : step === 3 ? (
          <Button className="ms-auto" disabled={busy || !selectedSlot} onClick={next}>
            {authenticated ? t("confirm") : t("next")}
          </Button>
        ) : null}
      </div>
      </Card>
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <Card elevated>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">{t("summary.eyebrow")}</p>
          <h2 className="mt-2 text-xl font-black">{t("summary.title")}</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div className="border-b border-border pb-4"><dt className="text-ink-muted">{t("summary.lesson")}</dt><dd className="mt-1 font-bold">{t(`step.what.${kind}`)}</dd></div>
            <div className="border-b border-border pb-4"><dt className="text-ink-muted">{t("summary.place")}</dt><dd className="mt-1 font-bold">{placeMode === "school" ? selectedLocation?.name ?? t("summary.notSelected") : pickupAddress || t("summary.notSelected")}</dd></div>
            <div className="border-b border-border pb-4"><dt className="text-ink-muted">{t("summary.teacher")}</dt><dd className="mt-1 font-bold">{selectedTeacher?.name ?? t("summary.notSelected")}</dd></div>
            <div><dt className="text-ink-muted">{t("summary.time")}</dt><dd className="mt-1 font-bold">{selectedSlot ? <><span>{selectedDateLabel}</span><span className="block [direction:ltr]">{timeFormatter.format(new Date(selectedSlot))}</span></> : t("summary.notSelected")}</dd></div>
          </dl>
          <Notice className="mt-5">{t("summary.reassurance")}</Notice>
        </Card>
      </aside>
      </div>
    </div>
  );
}
