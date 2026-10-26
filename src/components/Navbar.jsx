import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { site } from '../config'
import { useDecrypt } from '../lib/useDecrypt'
import { useSaved } from '../lib/bookmarks'
import ThemeToggle from './ThemeToggle'
import UtcClock from './UtcClock'
import { IS_MAC, openPalette } from '../lib/palette'

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

// Thin-line glyphs shown next to each nav label — monochrome like the home
// stat icons; the active page tints its glyph with the accent colour.
const ICONS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  post: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4.5L17 13H5" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4.5L6 21z" />,
}

function NavIcon({ name }) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

const primary = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/start-here', label: 'Start Here', icon: 'compass' },
  { to: '/about', label: 'About', icon: 'user' },
  { to: '/blog', label: 'Blog', icon: 'post' },
]

const more = [
  { to: '/glossary', label: 'Glossary', icon: 'book' },
  { to: '/ctf', label: 'CTF Events', icon: 'flag' },
  { to: '/saved', label: 'Saved', icon: 'bookmark' },
]

const allLinks = [...primary, ...more]

// NavLink whose label scrambles → resolves on hover/focus.
function DecryptNavLink({ to, label, icon, end, className, badge, ...rest }) {
  const { display, bind } = useDecrypt(label)
  return (
    <NavLink to={to} end={end} className={className} {...bind} {...rest}>
      {icon && <NavIcon name={icon} />}
      <span className="nav-label">{display}</span>
      {badge}
    </NavLink>
  )
}

function SocialIcon({ href, label, children }) {
  return (
    <a
      className="social-icon"
      href={href}
      target={href.startsWith('mailto:') ? undefined : '_blank'}
      rel="noreferrer"
      aria-label={label}
      title={label}
    >
      {children}
    </a>
  )
}

function Socials() {
  const s = site.socials
  return (
    <>
      <SocialIcon href={s.github} label="GitHub">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
      </SocialIcon>
      <SocialIcon href={s.linkedin} label="LinkedIn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0Z" />
        </svg>
      </SocialIcon>
      <SocialIcon href={s.academy} label="Disruption Academy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1.3 2.7 2.5 6 2.5s6-1.2 6-2.5v-5" />
        </svg>
      </SocialIcon>
    </>
  )
}

function MoreMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { pathname } = useLocation()
  const savedCount = useSaved().length
  const isActive = more.some((l) => l.to === pathname)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="nav-more" ref={ref}>
      <button
        type="button"
        className={`nav-link nav-more-btn${isActive ? ' active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <NavIcon name="grid" />
        More <span className="nav-more-caret">▾</span>
      </button>
      {open && (
        <div className="nav-more-menu" role="menu">
          {more.map((l) => (
            <DecryptNavLink
              key={l.to}
              to={l.to}
              label={l.label}
              icon={l.icon}
              role="menuitem"
              badge={
                l.to === '/saved' && savedCount > 0 ? (
                  <span className="nav-count">{savedCount}</span>
                ) : null
              }
              className={({ isActive }) =>
                isActive ? 'nav-more-item active' : 'nav-more-item'
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const savedCount = useSaved().length
  const logo = useDecrypt(site.handle)

  // close the mobile menu on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // close on Escape + lock body scroll while the mobile menu is open.
  // the `menu-open` class lets the floating buttons (ruler, back-to-top)
  // hide themselves so they don't overlap the menu.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    document.body.classList.add('menu-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      document.body.classList.remove('menu-open')
    }
  }, [open])

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" {...logo.bind}>
          <span className="logo-mark">&gt;_</span>
          {logo.display}
        </Link>

        <nav className="navbar-links">
          {primary.map((l) => (
            <DecryptNavLink
              key={l.to}
              to={l.to}
              label={l.label}
              icon={l.icon}
              end={l.end}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            />
          ))}
          <MoreMenu />
        </nav>

        <div className="navbar-socials">
          <button
            type="button"
            className="nav-search"
            onClick={openPalette}
            aria-label="Search posts and commands"
            title="Search posts and commands"
          >
            <SearchIcon />
            <kbd>{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <UtcClock className="navbar-clock" />
          <Socials />
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="navbar-search-mobile"
          onClick={openPalette}
          aria-label="Search posts and commands"
        >
          <SearchIcon />
        </button>

        <button
          type="button"
          className={`navbar-burger${open ? ' open' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="burger-box">
            <span className="burger-bar" />
            <span className="burger-bar" />
            <span className="burger-bar" />
          </span>
        </button>
      </div>

      <div className={`navbar-mobile${open ? ' open' : ''}`}>
        <div className="navbar-mobile-inner">
          <nav className="navbar-mobile-links">
            {allLinks.map((l) => (
              <DecryptNavLink
                key={l.to}
                to={l.to}
                label={l.label}
                icon={l.icon}
                end={l.end}
                badge={
                  l.to === '/saved' && savedCount > 0 ? (
                    <span className="nav-count">{savedCount}</span>
                  ) : null
                }
                className={({ isActive }) =>
                  isActive ? 'navbar-mobile-link active' : 'navbar-mobile-link'
                }
              />
            ))}
          </nav>
          <div className="navbar-mobile-socials">
            <Socials />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
