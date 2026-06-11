// Simple thin-line glyphs for the home stat cards — minimal and monochrome
// to match the theme (no tiles, gradients or gloss).
const GLYPHS = {
  articles: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  tools: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.6 5.6a1.5 1.5 0 0 0 2.1 2.1l5.6-5.6a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.1-.6-.6-2.1 2.4-2.4z" />
  ),
  certs: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M9 12.5 7.5 21 12 18.5 16.5 21 15 12.5" />
    </>
  ),
}

export default function StatIcon({ type }) {
  const glyph = GLYPHS[type]
  if (!glyph) return null

  return (
    <svg
      className="stat-icon"
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph}
    </svg>
  )
}
