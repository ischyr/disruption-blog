import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import { common } from 'lowlight'
import powershell from 'highlight.js/lib/languages/powershell'
import dos from 'highlight.js/lib/languages/dos'
import http from 'highlight.js/lib/languages/http'
import nginx from 'highlight.js/lib/languages/nginx'
import 'highlight.js/styles/github-dark-dimmed.css'
import remarkCallouts from '../lib/remarkCallouts'
import MermaidDiagram from './MermaidDiagram'

// `common` covers ~35 popular languages; register extras useful for
// security write-ups on top of it.
const languages = { ...common, powershell, dos, http, nginx }

// Recursively collect plain text from rendered children (used to recover the
// raw source of a fenced code block, e.g. for mermaid).
function getText(children) {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getText).join('')
  if (children?.props?.children) return getText(children.props.children)
  return ''
}

function CodeBlock({ children }) {
  const ref = useRef(null)
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(false)

  const className = children?.props?.className || ''
  const lang = /language-([\w+#-]+)/.exec(className)?.[1] || 'text'

  // mermaid fences render as diagrams, not code
  if (lang === 'mermaid') {
    return <MermaidDiagram chart={getText(children?.props?.children).trim()} />
  }

  const copy = async () => {
    const text = ref.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable (http, old browser) — silently ignore */
    }
  }

  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <span className="codeblock-lang">{lang}</span>
        <div className="codeblock-actions">
          <button
            type="button"
            className={`codeblock-btn${wrap ? ' active' : ''}`}
            onClick={() => setWrap((w) => !w)}
            aria-pressed={wrap}
            title="Toggle line wrapping"
          >
            wrap
          </button>
          <button type="button" className="codeblock-btn" onClick={copy}>
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
      </div>
      <pre ref={ref} className={wrap ? 'wrap' : undefined}>
        {children}
      </pre>
    </div>
  )
}

function copyHeadingLink(e, id) {
  e.preventDefault()
  const url = `${window.location.origin}${window.location.pathname}#${id}`
  navigator.clipboard?.writeText(url).catch(() => {})
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 90
    window.scrollTo({ top, behavior: 'smooth' })
  }
  if (window.history?.replaceState) {
    window.history.replaceState(null, '', `#${id}`)
  }
}

function heading(Tag) {
  return function Heading({ children, id, ...props }) {
    return (
      <Tag id={id} {...props}>
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="heading-anchor"
            aria-label="Copy link to this section"
            title="Copy link to this section"
            onClick={(e) => copyHeadingLink(e, id)}
          >
            #
          </a>
        )}
      </Tag>
    )
  }
}

const H1 = heading('h1')
const H2 = heading('h2')
const H3 = heading('h3')

export default function Markdown({ children }) {
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    if (!zoom) return
    const onKey = (e) => e.key === 'Escape' && setZoom(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCallouts]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { languages, ignoreMissing: true }]]}
        components={{
          pre: CodeBlock,
          h1: H1,
          h2: H2,
          h3: H3,
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
          img: ({ node, ...props }) => (
            <img
              {...props}
              className="md-img"
              loading="lazy"
              onClick={() => props.src && setZoom(props.src)}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>

      {zoom &&
        createPortal(
          <div
            className="lightbox"
            onClick={() => setZoom(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="lightbox-close"
              aria-label="Close"
              onClick={() => setZoom(null)}
            >
              ✕
            </button>
            <img src={zoom} alt="" />
          </div>,
          document.body
        )}
    </div>
  )
}
