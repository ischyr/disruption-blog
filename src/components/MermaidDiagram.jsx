import { useEffect, useRef, useState } from 'react'

// Lazy-load mermaid (it's large) only when a diagram is actually rendered.
let mermaidPromise
let idCounter = 0

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        fontFamily: "'JetBrains Mono', monospace",
        themeVariables: {
          background: '#0d0d0e',
          primaryColor: '#141416',
          primaryBorderColor: '#33343c',
          primaryTextColor: '#e9e9ee',
          secondaryColor: '#1c1c1f',
          tertiaryColor: '#1c1c1f',
          lineColor: '#5a5a63',
          fontSize: '14px',
        },
      })
      return mermaid
    })
  }
  return mermaidPromise
}

export default function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)
  const idRef = useRef(`mermaid-${(idCounter += 1)}`)

  useEffect(() => {
    let cancelled = false
    setError(false)
    loadMermaid()
      .then((mermaid) => mermaid.render(idRef.current, chart))
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [chart])

  if (error) {
    return <pre className="mermaid-error">{chart}</pre>
  }

  return (
    <div
      className="mermaid-diagram"
      // mermaid output is sanitized (securityLevel: 'strict')
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
