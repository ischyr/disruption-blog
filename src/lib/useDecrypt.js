// "Decrypt on hover" — scrambles text through random glyphs and resolves it
// left-to-right. Returns the current display string plus event handlers to bind
// onto the trigger element (so hovering/focusing anywhere on a link fires it).
import { useCallback, useEffect, useRef, useState } from 'react'

const GLYPHS = '!<>-_\\/[]{}=+*^?#01abcdef$%&'

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

export function useDecrypt(text, { speed = 1.6, jitter = 7 } = {}) {
  const [display, setDisplay] = useState(text)
  const raf = useRef(0)

  // keep the rendered text in sync if the source label changes
  useEffect(() => setDisplay(text), [text])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const run = useCallback(() => {
    if (reducedMotion()) return
    cancelAnimationFrame(raf.current)

    const chars = [...text]
    // each character resolves at a slightly randomised frame, biased by index
    const revealAt = chars.map((_, i) => i * speed + Math.random() * jitter)
    const target = chars.filter((c) => c.trim()).length
    let frame = 0

    const tick = () => {
      frame += 1
      let resolved = 0
      let out = ''
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i]
        if (!c.trim()) {
          out += c
        } else if (frame >= revealAt[i]) {
          out += c
          resolved += 1
        } else {
          out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
      }
      setDisplay(out)
      if (resolved >= target) {
        setDisplay(text)
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    tick()
  }, [text, speed, jitter])

  return { display, bind: { onMouseEnter: run, onFocus: run } }
}
