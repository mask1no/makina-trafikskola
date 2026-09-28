type StaticMapArtworkProps = {
  className?: string;
};

export function StaticMapArtwork({
  className = "",
}: StaticMapArtworkProps) {
  return (
    <div
      aria-hidden="true"
      className={`rtl-no-mirror relative overflow-hidden bg-card-muted ${className}`}
    >
      <svg
        viewBox="0 0 800 480"
        className="absolute inset-0 size-full"
        fill="none"
      >
        <path
          d="M-40 100C100 40 195 178 320 121S535 18 840 82V-20H-40Z"
          fill="var(--accent-soft)"
        />
        <path
          d="M-30 392c142-96 242 20 354-42 122-68 205-20 516-112v262H-30Z"
          fill="var(--page)"
        />
        <g stroke="var(--border-strong)" strokeLinecap="round">
          <path d="M20 360C160 308 214 190 405 173c160-14 235 52 390-3" strokeWidth="18" />
          <path d="M135 20c38 92 65 167 183 230 109 58 189 96 218 230" strokeWidth="12" />
          <path d="M7 208c112 26 206 2 284-68C367 72 474 51 616 76c61 11 119 5 184-25" strokeWidth="8" />
          <path d="M251 480c7-103 71-154 174-198 109-46 190-110 244-222" strokeWidth="8" />
        </g>
        <g stroke="var(--card)" strokeLinecap="round">
          <path d="M20 360C160 308 214 190 405 173c160-14 235 52 390-3" strokeWidth="8" />
          <path d="M135 20c38 92 65 167 183 230 109 58 189 96 218 230" strokeWidth="5" />
          <path d="M7 208c112 26 206 2 284-68C367 72 474 51 616 76c61 11 119 5 184-25" strokeWidth="4" />
          <path d="M251 480c7-103 71-154 174-198 109-46 190-110 244-222" strokeWidth="4" />
        </g>
        <circle cx="430" cy="195" r="28" fill="var(--accent)" />
        <circle cx="430" cy="195" r="9" fill="var(--accent-ink)" />
      </svg>
      <div className="absolute bottom-4 end-4 rounded-sm border border-border bg-card px-3 py-2 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent" />
          <span className="text-xs font-black text-ink">Makina</span>
        </div>
      </div>
    </div>
  );
}
