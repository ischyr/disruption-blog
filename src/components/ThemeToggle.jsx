import { useEffect, useState } from 'react'
import { getThemePref, applyTheme, systemTheme } from '../lib/theme'

const ORDER = ['system', 'light', 'dark']
const NEXT = { system: 'light', light: 'dark', dark: 'system' }

const ICONS = {
  // monitor
  system: <path d="M3 4h18v12H3zM8 20h8M12 16v4" />,
  // sun
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  // moon
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
}

const LABELS = { system: 'System', light: 'Light', dark: 'Dark' }

export default function ThemeToggle() {
  const [pref, setPref] = useState('system')

  useEffect(() => {
    setPref(getThemePref())
    // keep in sync if the OS theme changes while on "system"
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      if (getThemePref() === 'system') applyTheme('system')
    }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const cycle = () => {
    const next = NEXT[pref]
    setPref(next)
    applyTheme(next)
  }

  const hint = pref === 'system' ? `System (${systemTheme()})` : LABELS[pref]

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      aria-label={`Theme: ${hint}. Click to change.`}
      title={`Theme: ${hint}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[pref]}
      </svg>
    </button>
  )
}
