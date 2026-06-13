import { useEffect, useState } from 'react'

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Types each phrase, pauses, deletes, moves to the next — looping.
export default function Typewriter({
  phrases,
  typingSpeed = 70,
  deletingSpeed = 38,
  pause = 1500,
}) {
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduce) return
    const phrase = phrases[i % phrases.length]

    if (!deleting && text === phrase) {
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }
    if (deleting && text === '') {
      setDeleting(false)
      setI((v) => (v + 1) % phrases.length)
      return
    }
    const t = setTimeout(
      () =>
        setText((cur) =>
          deleting ? cur.slice(0, -1) : phrase.slice(0, cur.length + 1)
        ),
      deleting ? deletingSpeed : typingSpeed
    )
    return () => clearTimeout(t)
  }, [text, deleting, i, phrases, typingSpeed, deletingSpeed, pause])

  if (reduce) return <span className="typewriter">{phrases[0]}</span>

  return (
    <span className="typewriter">
      {text}
      <span className="tw-cursor" aria-hidden="true" />
    </span>
  )
}
