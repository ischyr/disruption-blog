import { useRef, useState } from 'react'
import { jumpTo } from '../lib/jumpTo'

// "Commands used" — every command the post runs, in order. Clicking one
// scrolls to it in the article and highlights the line; each can be copied,
// or all of them at once as a cheat sheet grouped by tool.

function cheatSheet(commands) {
  const byTool = new Map()
  for (const { tool, cmd } of commands) {
    if (!byTool.has(tool)) byTool.set(tool, [])
    byTool.get(tool).push(cmd)
  }
  return [...byTool].map(([tool, cmds]) => `# ${tool}\n${cmds.join('\n')}`).join('\n\n')
}

function useCopy() {
  const [copied, setCopied] = useState(null)
  const timer = useRef(null)
  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(null), 1400)
    } catch {
      /* clipboard unavailable (http, old browser) — silently ignore */
    }
  }
  return [copied, copy]
}

const TerminalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m4 17 6-5-6-5" />
    <path d="M12 19h8" />
  </svg>
)

function CommandList({ commands, copied, copy }) {
  return (
    <ol className="cmds-list">
      {commands.map((c, i) => (
        <li key={c.cmd} className="cmds-row">
          <button
            type="button"
            className="cmds-item"
            onClick={() => jumpTo(c.raw)}
            title={c.cmd}
          >
            <span className="cmds-tool">{c.tool}</span>
            <code className="cmds-cmd">{c.args || c.cmd}</code>
          </button>
          <button
            type="button"
            className={`cmds-copy${copied === i ? ' done' : ''}`}
            onClick={() => copy(i, c.cmd)}
            aria-label={`Copy command: ${c.cmd}`}
            title="Copy command"
          >
            {copied === i ? '✓' : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            )}
          </button>
        </li>
      ))}
    </ol>
  )
}

export default function CommandsPanel({ commands, variant = 'rail' }) {
  const [copied, copy] = useCopy()
  const copyAll = (
    <button
      type="button"
      className="codeblock-btn cmds-copy-all"
      onClick={() => copy('all', cheatSheet(commands))}
      title="Copy every command as a cheat sheet"
    >
      {copied === 'all' ? '✓ copied' : 'copy all'}
    </button>
  )

  // narrow screens: the side rails are hidden, so show a collapsible block
  // above the article instead
  if (variant === 'inline') {
    return (
      <details className="cmds cmds-inline">
        <summary className="cmds-summary">
          <TerminalIcon />
          <span>Commands used</span>
          <span className="toc-count">{commands.length}</span>
        </summary>
        <div className="cmds-inline-body">
          {copyAll}
          <CommandList commands={commands} copied={copied} copy={copy} />
        </div>
      </details>
    )
  }

  return (
    <nav className="cmds cmds-rail" aria-label="Commands used in this post">
      <div className="toc-header">
        <TerminalIcon />
        <span>Commands</span>
        <span className="toc-count">{commands.length}</span>
      </div>
      {copyAll}
      <CommandList commands={commands} copied={copied} copy={copy} />
    </nav>
  )
}
