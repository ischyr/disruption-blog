import { useState } from 'react'
import { payloads, shells, listeners } from '../data/revshells'

const TOKEN = /(\{ip\}|\{port\}|\{shell\})/g

function build(tpl, v) {
  return tpl
    .replaceAll('{ip}', v.ip || 'IP')
    .replaceAll('{port}', v.port || 'PORT')
    .replaceAll('{shell}', v.shell)
}

function Highlighted({ tpl, v }) {
  return tpl.split(TOKEN).map((p, i) => {
    if (p === '{ip}') return <span key={i} className="rsg-hl">{v.ip || 'IP'}</span>
    if (p === '{port}') return <span key={i} className="rsg-hl">{v.port || 'PORT'}</span>
    if (p === '{shell}') return <span key={i} className="rsg-hl rsg-hl-dim">{v.shell}</span>
    return <span key={i}>{p}</span>
  })
}

function CopyBtn({ text, compact }) {
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
    <button type="button" className="rsg-copy" onClick={copy}>
      {done ? '✓' : compact ? 'copy' : 'copy'}
    </button>
  )
}

export default function ReverseShellGenerator() {
  const [ip, setIp] = useState('10.10.14.1')
  const [port, setPort] = useState('4444')
  const [shell, setShell] = useState(shells[0])
  const [sel, setSel] = useState(payloads[0].id)
  const [lst, setLst] = useState(listeners[0].label)

  const v = { ip, port, shell }
  const payload = payloads.find((p) => p.id === sel) || payloads[0]
  const listener = listeners.find((l) => l.label === lst) || listeners[0]

  return (
    <div className="rsg">
      <div className="rsg-controls">
        <label className="rsg-field">
          <span>LHOST</span>
          <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.10.14.1" />
        </label>
        <label className="rsg-field rsg-field-sm">
          <span>LPORT</span>
          <input
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="4444"
            inputMode="numeric"
          />
        </label>
        <label className="rsg-field">
          <span>Shell</span>
          <select value={shell} onChange={(e) => setShell(e.target.value)}>
            {shells.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rsg-main">
        <div className="rsg-list">
          {payloads.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`rsg-item${sel === p.id ? ' active' : ''}`}
              onClick={() => setSel(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="rsg-output">
          <div className="rsg-cmd" key={`${sel}|${ip}|${port}|${shell}`}>
            <code>
              <Highlighted tpl={payload.tpl} v={v} />
            </code>
            <CopyBtn text={build(payload.tpl, v)} />
          </div>

          <div className="rsg-listener">
            <span className="rsg-listener-label">Listener</span>
            <div className="rsg-cmd" key={`${lst}|${port}`}>
              <code>
                <Highlighted tpl={listener.tpl} v={v} />
              </code>
              <CopyBtn text={build(listener.tpl, v)} compact />
            </div>
            <div className="rsg-listener-tabs">
              {listeners.map((l) => (
                <button
                  key={l.label}
                  type="button"
                  className={`rsg-ltab${lst === l.label ? ' active' : ''}`}
                  onClick={() => setLst(l.label)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
