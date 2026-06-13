import { useState } from 'react'

export default function CopyButton({ text, className = 'rsg-copy', label = 'copy' }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button type="button" className={className} onClick={copy}>
      {done ? '✓' : label}
    </button>
  )
}
