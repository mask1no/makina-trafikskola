import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-page p-6 text-ink">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-card">
        <p className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">404</p>
        <h1 className="mt-3 text-3xl font-black">Sidan finns inte</h1>
        <p className="mt-3 leading-7 text-ink-muted">
          Gå till startsidan för att fortsätta.
        </p>
        <Link
          href="/sv"
          className="mt-6 inline-flex min-h-11 items-center rounded-sm border border-accent bg-accent px-5 text-sm font-bold text-accent-ink"
        >
          Till /sv
        </Link>
      </div>
    </main>
  );
}
