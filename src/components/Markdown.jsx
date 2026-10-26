import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import c from 'highlight.js/lib/languages/c'
import bash from 'highlight.js/lib/languages/bash'
import plaintext from 'highlight.js/lib/languages/plaintext'
import 'highlight.js/styles/github-dark-dimmed.css'
import remarkCallouts from '../lib/remarkCallouts'
import rehypeTerminal from '../lib/rehypeTerminal'
import MermaidDiagram from './MermaidDiagram'
import TerminalDots from './TerminalDots'

// Only these languages are bundled, to keep the reader chunk small. Any other
// code-fence language falls back to plain text (rehypeHighlight ignoreMissing).
// `plaintext` also covers the `text` / `txt` fences via its built-in aliases.
const languages = { c, bash, plaintext }

// Recursively collect plain text from rendered children (used to recover the
// raw source of a fenced code block, e.g. for mermaid).
function getText(children) {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getText).join('')
  if (children?.props?.children) return getText(children.props.children)
  return ''
}

// Long tool output (nmap, secretsdump…) folds so a post isn't a wall of text.
const FOLD_OVER = 30 // blocks longer than this many lines fold…
const FOLD_TO = 15 // …down to this many (keep in sync with .codeblock.folded pre)

function CodeBlock({ children }) {
  const ref = useRef(null)
  const boxRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // the Commands panel / Ctrl+K palette ask a folded block to open before
  // jumping to a line inside it
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const open = () => setExpanded(true)
    el.addEventListener('codeblock:expand', open)
    return () => el.removeEventListener('codeblock:expand', open)
  }, [])

  const className = children?.props?.className || ''
  const lang = /language-([\w+#-]+)/.exec(className)?.[1] || 'text'
  const source = getText(children?.props?.children)

  // mermaid fences render as diagrams, not code
  if (lang === 'mermaid') {
    return <MermaidDiagram chart={source.trim()} />
  }

  const lineCount = source.replace(/\n$/, '').split('\n').length
  const foldable = lineCount > FOLD_OVER
  const folded = foldable && !expanded

  const toggleFold = () => {
    // folding a block you've scrolled into: bring its top back into view
    // first, so the page doesn't jump past it
    const top = boxRef.current?.getBoundingClientRect().top ?? 0
    if (expanded && top < 0) window.scrollBy({ top: top - 90 })
    setExpanded((e) => !e)
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

  // styled as a terminal window: traffic-light dots, the language as the
  // window title, and the actions on the right
  return (
    <div className={`codeblock${folded ? ' folded' : ''}`} ref={boxRef}>
      <div className="codeblock-header">
        <TerminalDots />
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
      {foldable && (
        <button
          type="button"
          className="codeblock-fold"
          onClick={toggleFold}
          aria-expanded={!folded}
        >
          {folded ? `show all (${lineCount} lines) ▾` : `collapse to ${FOLD_TO} lines ▴`}
        </button>
      )}
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
        rehypePlugins={[
          rehypeSlug,
          [rehypeHighlight, { languages, ignoreMissing: true }],
          rehypeTerminal, // after highlighting, so prompts land between tokens
        ]}
        components={{
          pre: CodeBlock,
          h1: H1,
          h2: H2,
          h3: H3,
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
          img: ({ src, alt, title }) => (
            <img
              src={src}
              alt={alt}
              title={title}
              className="md-img"
              loading="lazy"
              decoding="async"
              onClick={() => src && setZoom(src)}
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
