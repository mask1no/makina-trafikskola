import Link from "next/link";

import { CallButton, MailButton } from "@/components/ContactButtons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteLogo } from "@/components/SiteHeader";
import type { TeachingLanguage } from "@/lib/teachers/languages";

export type SiteFooterPlace = {
  city: string;
  slug: string;
  status: string;
};

export type SiteFooterStoreLink = {
  label: string;
  url: string;
};

export type SiteFooterSocialLink = {
  label: string;
  url: string;
  network: "facebook" | "instagram" | "tiktok";
};

function SocialIcon({ network }: { network: SiteFooterSocialLink["network"] }) {
  if (network === "facebook") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M14.5 8.5V6.8c0-.7.5-1.1 1.2-1.1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
      </svg>
    );
  }
  if (network === "instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M14.2 3.2c.5 2.4 1.8 3.8 4.1 4.2v2.6c-1.4 0-2.6-.4-3.7-1.2v6.6c0 3.3-2.5 5.6-5.6 5.6S3.4 18.7 3.4 15.4c0-3.2 2.5-5.6 5.6-5.6.4 0 .8 0 1.2.1v2.8a3 3 0 0 0-1.2-.3c-1.7 0-2.9 1.3-2.9 3s1.2 3 2.9 3 2.9-1.3 2.9-3V3.2h2.3Z" />
    </svg>
  );
}

export type SiteFooterLabels = {
  callUs: string;
  comingSoonPlace: (town: string) => string;
  contact: string;
  cookies: string;
  copyright: string;
  courses: string;
  explore: string;
  footerDescription: string;
  here: string;
  languages: string;
  languageNames: Record<TeachingLanguage, string>;
  lessons: string;
  mailUs: string;
  prices: string;
  privacy: string;
  schoolIn: (town: string) => string;
  teachers: string;
  terms: string;
  theory: string;
  appBadges: string;
  socials: string;
};

export function SiteFooter({
  base,
  company,
  labels,
  offeredLanguages,
  places,
  showInstructors,
  showTheory,
  storeLinks,
  socialLinks,
  authenticated = false,
}: {
  base: string;
  company: { email: string; legalName: string; phone: string };
  labels: SiteFooterLabels;
  offeredLanguages: TeachingLanguage[];
  places: SiteFooterPlace[];
  showInstructors: boolean;
  showTheory: boolean;
  storeLinks: SiteFooterStoreLink[];
  socialLinks: SiteFooterSocialLink[];
  authenticated?: boolean;
}) {
  const footerLinkClass =
    "flex min-h-11 items-center py-2 leading-5 transition hover:text-ink-inverse";

  return (
    <footer className="bg-page py-10 sm:py-14">
      <div className="site-container">
        <div className="rounded-xl border border-ink bg-surface p-5 text-ink-inverse sm:p-7 lg:p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
            <div className="sm:col-span-2 lg:col-span-4">
              <SiteLogo />
              <p className="mt-4 max-w-[70ch] text-small leading-6 text-ink-inverse-muted">
                {labels.footerDescription}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CallButton phone={company.phone} size="small">
                  {labels.callUs}
                </CallButton>
                <MailButton email={company.email} size="small">
                  {labels.mailUs}
                </MailButton>
              </div>
              {socialLinks.length ? (
                <nav className="mt-4 flex flex-wrap gap-2" aria-label={labels.socials}>
                  {socialLinks.map((item) => (
                    <a
                      key={item.network}
                      href={item.url}
                      aria-label={item.label}
                      className="inline-flex size-11 items-center justify-center rounded-sm border border-ink-inverse/20 text-ink-inverse transition hover:border-ink-inverse/40 hover:bg-surface-raised"
                      rel="noreferrer"
                      target="_blank"
                    >
                      <SocialIcon network={item.network} />
                    </a>
                  ))}
                </nav>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <p className="text-small font-extrabold">{labels.explore}</p>
              <div className="mt-3 grid grid-cols-2 gap-x-3 text-small text-ink-inverse-muted sm:grid-cols-1">
                <Link className={footerLinkClass} href={`${base}/priser`}>
                  {labels.prices}
                </Link>
                {showInstructors ? (
                  <Link className={footerLinkClass} href={`${base}/larare`}>
                    {labels.teachers}
                  </Link>
                ) : null}
                {showTheory ? (
                  <Link className={footerLinkClass} href={`${base}/teori`}>
                    {labels.theory}
                  </Link>
                ) : null}
                <Link className={footerLinkClass} href={`${base}/kontakt`}>
                  {labels.contact}
                </Link>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-3">
              <p className="text-small font-extrabold">{labels.languages}</p>
              <div className="mt-3">
                <LanguageSwitcher authenticated={authenticated} />
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 text-small text-ink-inverse-muted sm:grid-cols-1">
                {offeredLanguages.map((code) => (
                  <li
                    key={code}
                    className="flex min-h-11 items-center gap-2 py-2 leading-5"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-4 shrink-0 text-success-strong"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M5 12.5 10 17l9-10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {labels.languageNames[code]}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 lg:col-span-3">
              <p className="text-small font-extrabold">{labels.here}</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 text-small text-ink-inverse-muted sm:grid-cols-1">
                {places.map((place) => (
                  <li key={place.slug}>
                    {place.status === "ACTIVE" ? (
                      <Link
                        className="flex min-h-11 items-center py-2 leading-5 hover:text-ink-inverse"
                        href={`${base}/trafikskola/${place.slug}`}
                      >
                        {labels.schoolIn(place.city)}
                      </Link>
                    ) : (
                      <span className="flex min-h-11 items-center py-2 leading-5">
                        {labels.comingSoonPlace(place.city)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {storeLinks.length ? (
                <div className="mt-5">
                  <p className="text-small font-extrabold">{labels.appBadges}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {storeLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.url}
                        className="inline-flex min-h-11 items-center rounded-sm border border-ink-inverse/20 px-4 text-small font-bold text-ink-inverse"
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-ink-inverse/10 pt-5 text-xs font-semibold text-ink-inverse-muted sm:flex-row sm:items-center sm:justify-between">
            <p>{labels.copyright}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link className="min-h-11 inline-flex items-center hover:text-ink-inverse" href={`${base}/villkor`}>
                {labels.terms}
              </Link>
              <Link className="min-h-11 inline-flex items-center hover:text-ink-inverse" href={`${base}/integritet`}>
                {labels.privacy}
              </Link>
              <Link className="min-h-11 inline-flex items-center hover:text-ink-inverse" href={`${base}/cookies`}>
                {labels.cookies}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
