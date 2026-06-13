import { Link } from 'react-router-dom'
import { site } from '../config'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>
          © {new Date().getFullYear()} {site.handle}
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
