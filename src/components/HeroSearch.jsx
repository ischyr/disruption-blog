import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Sends the query to the blog page, which already filters on ?q=.
export default function HeroSearch() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const v = q.trim()
    navigate(v ? `/blog?q=${encodeURIComponent(v)}` : '/blog')
  }

  return (
    <form className="hero-search" role="search" onSubmit={submit}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search write-ups, tools, tags…"
        aria-label="Search the blog"
      />
      <button type="submit">Search</button>
    </form>
  )
}
