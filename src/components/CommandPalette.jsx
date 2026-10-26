import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { posts } from '../lib/posts'
import TerminalDots from './TerminalDots'

import { IS_MAC } from '../lib/palette'

// Ctrl/⌘+K (or "/") — a terminal-style search over every post and every
// command in every post, so the write-ups double as one searchable cheat
// sheet. Enter opens a post (and jumps to the command); Ctrl+C copies it.
// Mounted (lazily) by PaletteLauncher only while open.

// The command index is its own chunk; fetch it once, on first open.
let indexPromise
const loadIndex = () => {
  indexPromise ??= import('virtual:command-index').then((m) => m.default)
  return indexPromise
}

const MAX_POSTS = 5
const MAX_CMDS_PER_POST = 6
const MAX_CMDS = 40
const EXAMPLES = ['certipy req', 'bloodyAD set password', 'secretsdump', 'ligolo']

function search(index, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return { postHits: posts.slice(0, MAX_POSTS), groups: [] }
  const phrase = terms.join(' ')
  const hasAll = (hay) => terms.every((t) => hay.includes(t))

  const postHits = posts
    .map((p) => {
      const title = p.title.toLowerCase()
      const hay = `${title} ${p.tags.join(' ')} ${p.excerpt || ''}`.toLowerCase()
      if (!hasAll(hay)) return null
      const score =
        (title.includes(phrase) ? 10 : 0) +
        (p.tags.some((t) => t.toLowerCase() === phrase) ? 6 : 0)
      return { p, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_POSTS)
    .map((h) => h.p)

  const groups = []
  for (const post of index) {
    const hits = []
    for (const c of post.commands) {
      const cmd = c.cmd.toLowerCase()
      if (!hasAll(cmd)) continue
      const tool = c.tool.toLowerCase()
      const score =
        (cmd.includes(phrase) ? 5 : 0) + (tool.startsWith(terms[0]) ? 3 : 0)
      hits.push({ c, score })
    }
    if (!hits.length) continue
    hits.sort((a, b) => b.score - a.score)
    groups.push({ post, hits, best: hits[0].score })
  }
  // best match first, then newest
  groups.sort((a, b) => b.best - a.best || new Date(b.post.date) - new Date(a.post.date))

  let budget = MAX_CMDS
  const trimmed = []
  for (const g of groups) {
    if (budget <= 0) break
    const shown = g.hits.slice(0, Math.min(MAX_CMDS_PER_POST, budget))
    budget -= shown.length
    trimmed.push({ post: g.post, hits: shown, more: g.hits.length - shown.length })
  }
  return { postHits, groups: trimmed, total: groups.reduce((n, g) => n + g.hits.length, 0) }
}

// Long commands: keep the start (through the first match), then skip ahead to
// just before the furthest-in match, so every search term stays visible.
function snippet(cmd, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (cmd.length <= 60 || !terms.length) return cmd
  const lower = cmd.toLowerCase()
  const hits = terms.map((t) => [lower.indexOf(t), t.length]).filter(([i]) => i >= 0)
  if (!hits.length) return cmd
  const [firstAt, firstLen] = hits.reduce((a, b) => (b[0] < a[0] ? b : a))
  const lastAt = Math.max(...hits.map(([i]) => i))
  const headEnd = firstAt + firstLen
  // start the tail at a word boundary a little before the last match
  const tailFrom = lower.lastIndexOf(' ', Math.max(headEnd, lastAt - 12)) + 1
  if (lastAt < 40 || tailFrom <= headEnd + 4) return cmd
  return `${cmd.slice(0, headEnd)} … ${cmd.slice(tailFrom)}`
}

// Wrap each search term in <mark>.
function Highlight({ text, query }) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return text
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'))
  return parts.map((part, i) =>
    i % 2 ? <mark key={i}>{part}</mark> : part
  )
}

export default function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const [index, setIndex] = useState(null)
  const [copied, setCopied] = useState(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()

  // on open: fetch the command index, focus the input, lock page scroll
  useEffect(() => {
    let active = true
    loadIndex().then((data) => active && setIndex(data))
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      active = false
      document.body.style.overflow = ''
    }
  }, [])

  const results = useMemo(() => search(index || [], query), [index, query])

  // selectable rows in render order (`rows`), plus each section's rows tagged
  // with their position in that flat list for keyboard selection
  const { rows, postRows, groupRows } = useMemo(() => {
    const flat = []
    const add = (row) => {
      flat.push(row)
      return { row, idx: flat.length - 1 }
    }
    const postRows = results.postHits.map((p) => add({ kind: 'post', post: p }))
    const groupRows = results.groups.map((g) => ({
      ...g,
      items: g.hits.map((h) => add({ kind: 'cmd', post: g.post, c: h.c })),
    }))
    return { rows: flat, postRows, groupRows }
  }, [results])

  // keep the selected row visible
  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel, rows])

  const close = onClose

  const choose = (row) => {
    if (!row) return
    close()
    if (row.kind === 'post') navigate(`/blog/${row.post.slug}`)
    // BlogPost picks up `jump` and scrolls to the command once the body renders
    else navigate(`/blog/${row.post.slug}`, { state: { jump: row.c.raw || row.c.cmd } })
  }

  const copy = async (row, i) => {
    if (row?.kind !== 'cmd') return
    try {
      await navigator.clipboard.writeText(row.c.cmd)
      setCopied(i)
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1400)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(s + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(rows[sel])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === 'c' &&
      e.target.selectionStart === e.target.selectionEnd
    ) {
      // nothing selected in the input → copy the highlighted command instead
      e.preventDefault()
      copy(rows[sel], sel)
    }
  }

  const rowProps = ({ row, idx }) => ({
    'data-selected': idx === sel,
    className: `palette-row${idx === sel ? ' selected' : ''}`,
    onMouseMove: () => idx !== sel && setSel(idx),
    onClick: () => choose(row),
  })

  return createPortal(
    <div className="palette-backdrop" onMouseDown={close}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search posts and commands"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="palette-bar">
          <TerminalDots />
          <span className="palette-title">grep -ri — posts &amp; commands</span>
          <kbd className="palette-kbd">esc</kbd>
        </div>

        <label className="palette-input-row">
          <span className="palette-prompt">➜</span>
          <span className="palette-cwd">~/blog</span>
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSel(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="search posts, tools, commands…"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search"
          />
        </label>

        <div className="palette-results" ref={listRef}>
          {postRows.length > 0 && (
            <div className="palette-section">
              <div className="palette-heading">{query.trim() ? 'posts' : 'recent posts'}</div>
              {postRows.map((item) => {
                const p = item.row.post
                return (
                  <button type="button" key={p.slug} {...rowProps(item)}>
                    <span className="palette-row-icon">#</span>
                    <span className="palette-row-main">
                      <Highlight text={p.title} query={query} />
                    </span>
                    <span className="palette-row-meta">{p.tags.slice(0, 2).join(' · ')}</span>
                  </button>
                )
              })}
            </div>
          )}

          {groupRows.map((g) => (
            <div className="palette-section" key={g.post.slug}>
              <div className="palette-heading">{g.post.title}</div>
              {g.items.map((item) => {
                const { row, idx } = item
                const { c } = row
                return (
                  <button type="button" key={c.cmd} {...rowProps(item)} title={c.cmd}>
                    <span className="palette-row-icon prompt">➜</span>
                    <code className="palette-cmd">
                      <Highlight text={snippet(c.cmd, query)} query={query} />
                    </code>
                    <span
                      role="button"
                      tabIndex={-1}
                      className={`palette-copy${copied === idx ? ' done' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        copy(row, idx)
                      }}
                      title="Copy command"
                    >
                      {copied === idx ? '✓ copied' : 'copy'}
                    </span>
                  </button>
                )
              })}
              {g.more > 0 && <div className="palette-more">+{g.more} more in this post</div>}
            </div>
          ))}

          {query.trim() && rows.length === 0 && (
            <div className="palette-empty">
              {index ? (
                <>
                  grep: no matches for <code>{query}</code>
                </>
              ) : (
                'loading command index…'
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="palette-hints">
              try:{' '}
              {EXAMPLES.map((ex) => (
                <button
                  type="button"
                  key={ex}
                  className="palette-example"
                  onClick={() => {
                    setQuery(ex)
                    setSel(0)
                    inputRef.current?.focus()
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>{IS_MAC ? '⌘' : 'ctrl'}</kbd>
            <kbd>c</kbd> copy command
          </span>
          {results.total > 0 && <span className="palette-total">{results.total} commands</span>}
        </div>
      </div>
    </div>,
    document.body
  )
}
