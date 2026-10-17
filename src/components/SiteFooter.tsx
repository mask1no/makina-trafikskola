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
};

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
        <div className="rounded-xl bg-surface p-5 text-ink-inverse sm:p-7 lg:p-8">
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
            </div>

            <div className="min-w-0 lg:col-span-2">
              <p className="text-small font-extrabold">{labels.explore}</p>
              <div className="mt-3 grid grid-cols-2 gap-x-3 text-small text-ink-inverse-muted sm:grid-cols-1">
                <Link className={footerLinkClass} href={`${base}/korlektioner`}>
                  {labels.lessons}
                </Link>
                <Link className={footerLinkClass} href={`${base}/priser`}>
                  {labels.prices}
                </Link>
                <Link className={footerLinkClass} href={`${base}/kurser`}>
                  {labels.courses}
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
              {socialLinks.length ? (
                <div className="mt-5">
                  <p className="text-small font-extrabold">{labels.socials}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {socialLinks.map((item) => (
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
