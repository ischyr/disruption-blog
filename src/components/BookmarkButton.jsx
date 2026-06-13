import { toggleSaved, useSaved } from '../lib/bookmarks'

// Toggle a post into the local reading list. `variant="icon"` is a compact
// circular button (used on cards); the default shows a label.
export default function BookmarkButton({ slug, variant = 'label' }) {
  const saved = useSaved().includes(slug)

  const handle = (e) => {
    // cards wrap the button in a <Link> — don't navigate when toggling
    e.preventDefault()
    e.stopPropagation()
    toggleSaved(slug)
  }

  return (
    <button
      type="button"
      className={`bookmark-btn bookmark-${variant}${saved ? ' saved' : ''}`}
      aria-pressed={saved}
      title={saved ? 'Remove from reading list' : 'Save for later'}
      onClick={handle}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
      </svg>
      {variant === 'label' && (
        <span className="bookmark-text">{saved ? 'Saved' : 'Save'}</span>
      )}
    </button>
  )
}
