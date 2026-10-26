import { lazy, Suspense, useEffect, useState } from 'react'
import { PALETTE_EVENT } from '../lib/palette'

// Always mounted, but tiny: it only listens for the shortcuts and loads the
// real palette (with the post + command indexes) the first time it's opened.
const CommandPalette = lazy(() => import('./CommandPalette'))

export default function PaletteLauncher() {
  const [open, setOpen] = useState(false)

  // Ctrl/⌘+K anywhere toggles; "/" opens when you're not typing somewhere
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setOpen(true)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(PALETTE_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(PALETTE_EVENT, onOpen)
    }
  }, [])

  if (!open) return null
  return (
    <Suspense fallback={null}>
      <CommandPalette onClose={() => setOpen(false)} />
    </Suspense>
  )
}
