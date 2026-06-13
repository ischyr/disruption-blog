import { Link, useNavigate } from 'react-router-dom'
import { flushSync } from 'react-dom'

// A react-router Link that wraps the navigation in the native View Transitions
// API, so elements sharing a `view-transition-name` (e.g. a post card's cover
// and the post's hero image) morph into each other. Falls back to a normal
// navigation when the API is unavailable or the user prefers reduced motion.
export default function TransitionLink({ to, children, onClick, ...rest }) {
  const navigate = useNavigate()

  const handleClick = (e) => {
    onClick?.(e)
    // let the browser handle modified clicks (new tab, etc.) and right/middle
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return
    }
    if (
      typeof document === 'undefined' ||
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return // fall through to react-router's default client navigation
    }

    e.preventDefault()
    const root = document.documentElement
    root.classList.add('vt-active') // suppress the route fade during the morph
    const transition = document.startViewTransition(() => {
      flushSync(() => navigate(to))
    })
    transition.finished.finally(() => root.classList.remove('vt-active'))
  }

  return (
    <Link to={to} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
