import { Link, useLocation } from 'react-router-dom'
import { site } from '../config'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <div className="page page-narrow notfound">
      <p className="shell-line">
        <span className="shell-prompt">[{site.handle}@web]$</span> cat{' '}
        {pathname}
        <br />
        <span className="error">
          cat: {pathname}: No such file or directory
        </span>
      </p>

      <h1 className="notfound-code">404</h1>
      <p className="page-subtitle">
        This page got nmap&apos;d out of existence — or never existed.
      </p>

      <div className="hero-actions">
        <Link to="/" className="btn btn-primary">
          cd ~
        </Link>
        <Link to="/blog" className="btn">
          ls ~/blog
        </Link>
      </div>
    </div>
  )
}
