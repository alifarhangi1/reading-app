/*
 * The brand mark from design/brandAssets.pdf: an ink rounded square with a
 * lowercase "a" and a terracotta dot. The letterform is drawn as geometry
 * rather than <text> so it renders identically without the brand font loaded —
 * which matters for the favicon, where no webfont is available at all.
 *
 * Brand tokens are used verbatim here (ink #1a1a1a, terracotta #b4562f) rather
 * than the app's --ink/--accent, so the mark stays exact wherever it sits.
 */
export function BrandMark({ size = 28, radiusPct = 19 }: { size?: number; radiusPct?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Ali's Reading App"
      className="brand-mark"
    >
      <rect width="32" height="32" rx={32 * (radiusPct / 100)} fill="#1a1a1a" />
      <circle cx="13.7" cy="19.6" r="4.05" fill="none" stroke="#ffffff" strokeWidth="3.6" />
      <rect x="16.1" y="12.9" width="3.5" height="12.5" rx="1.2" fill="#ffffff" />
      <circle cx="23" cy="23" r="2.15" fill="#b4562f" />
    </svg>
  )
}

export function BrandLockup({ size = 28 }: { size?: number }) {
  return (
    <span className="brand">
      <BrandMark size={size} />
      <span className="brand-wordmark">ali&rsquo;s reading app</span>
    </span>
  )
}
