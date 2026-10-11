import Link from "next/link";

import { CallButton, MailButton } from "@/components/ContactButtons";
import { SiteLogo } from "@/components/SiteHeader";
import { formatLanguageList } from "@/lib/company/staff";
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
  languageHelp: string;
  languageHelpDescription: (languages: string) => string;
  languageNames: Record<TeachingLanguage, string>;
  legal: string;
  lessons: string;
  mailUs: string;
  privacy: string;
  schoolIn: (town: string) => string;
  teachers: string;
  terms: string;
  theory: string;
};

export function SiteFooter({
  base,
  company,
  labels,
  locale,
  offeredLanguages,
  places,
  showInstructors,
  showTheory,
  storeLinks,
}: {
  base: string;
  company: { email: string; legalName: string; phone: string };
  labels: SiteFooterLabels;
  locale: string;
  offeredLanguages: TeachingLanguage[];
  places: SiteFooterPlace[];
  showInstructors: boolean;
  showTheory: boolean;
  storeLinks: SiteFooterStoreLink[];
}) {
  const footerLinkClass =
    "flex min-h-11 items-center py-2 leading-5 transition hover:text-ink-inverse";

  return (
    <footer className="border-t border-surface-soft bg-surface py-10 text-ink-inverse sm:py-14">
      <div className="site-container grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12 lg:gap-8">
        <div className="col-span-2 lg:col-span-4">
          <SiteLogo />
          <p className="mt-5 max-w-[70ch] text-body leading-7 text-ink-inverse-muted">
            {labels.footerDescription}
          </p>
          <address className="mt-5 max-w-[70ch] text-small not-italic leading-6 text-ink-inverse-muted">
            <p className="font-bold text-ink-inverse">{company.legalName}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CallButton phone={company.phone} size="small">
                {labels.callUs}
              </CallButton>
              <MailButton email={company.email} size="small">
                {labels.mailUs}
              </MailButton>
            </div>
          </address>
        </div>
        <div className="min-w-0 lg:col-span-2">
          <p className="text-small font-extrabold">{labels.explore}</p>
          <div className="mt-4 grid text-small text-ink-inverse-muted">
            <Link className={footerLinkClass} href={`${base}/korlektioner`}>
              {labels.lessons}
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
        <div className="min-w-0 lg:col-span-2">
          <p className="text-small font-extrabold">{labels.legal}</p>
          <div className="mt-4 grid text-small text-ink-inverse-muted">
            <Link className={footerLinkClass} href={`${base}/villkor`}>
              {labels.terms}
            </Link>
            <Link className={footerLinkClass} href={`${base}/integritet`}>
              {labels.privacy}
            </Link>
            <Link className={footerLinkClass} href={`${base}/cookies`}>
              {labels.cookies}
            </Link>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-2">
          <p className="text-small font-extrabold">{labels.languageHelp}</p>
          <p className="mt-4 max-w-[70ch] text-small leading-6 text-ink-inverse-muted">
            {labels.languageHelpDescription(
              formatLanguageList(
                offeredLanguages,
                locale,
                (code) => labels.languageNames[code],
              ),
            )}
          </p>
          <ul className="mt-4 grid text-small text-ink-inverse-muted">
            {offeredLanguages.map((code) => (
              <li
                key={code}
                className="flex min-h-11 items-center gap-2 py-2 leading-5"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-success"
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
        <div className="min-w-0 lg:col-span-2">
          <p className="text-small font-extrabold">{labels.here}</p>
          <ul className="mt-4 grid text-small text-ink-inverse-muted">
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
        </div>
      </div>
      {storeLinks.length ? (
        <div className="site-container mt-8 flex flex-wrap justify-center gap-3">
          {storeLinks.map((item) => (
            <a
              key={item.label}
              href={item.url}
              className="inline-flex min-h-11 items-center rounded-full border border-ink-inverse/20 px-4 text-small font-bold text-ink-inverse"
              rel="noreferrer"
              target="_blank"
            >
              {item.label}
            </a>
          ))}
        </div>
      ) : null}
      <div className="site-container mt-10 border-t border-surface-soft pt-6 text-center text-xs font-semibold text-ink-inverse-muted">
        <p>{labels.copyright}</p>
      </div>
    </footer>
  );
}
