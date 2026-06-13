import { Link } from 'react-router-dom'
import { site } from '../config'
import UtcClock from './UtcClock'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copy">
          © {new Date().getFullYear()} {site.handle}
          <UtcClock className="footer-clock" />
        </span>
        <nav className="footer-links">
          <Link to="/blog">Blog</Link>
          <Link to="/tools">Tools</Link>
          <a href={site.socials.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={site.academy} target="_blank" rel="noreferrer">
            Academy
          </a>
          <a href="/feed.xml" target="_blank" rel="noreferrer">
            RSS
          </a>
        </nav>
      </div>
    </footer>
  )
}
