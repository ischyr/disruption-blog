import { useState } from 'react'
import CopyButton from './CopyButton'

const METRICS = [
  { id: 'AV', label: 'Attack Vector', opts: [['N', 'Network'], ['A', 'Adjacent'], ['L', 'Local'], ['P', 'Physical']] },
  { id: 'AC', label: 'Attack Complexity', opts: [['L', 'Low'], ['H', 'High']] },
  { id: 'PR', label: 'Privileges Required', opts: [['N', 'None'], ['L', 'Low'], ['H', 'High']] },
  { id: 'UI', label: 'User Interaction', opts: [['N', 'None'], ['R', 'Required']] },
  { id: 'S', label: 'Scope', opts: [['U', 'Unchanged'], ['C', 'Changed']] },
  { id: 'C', label: 'Confidentiality', opts: [['H', 'High'], ['L', 'Low'], ['N', 'None']] },
  { id: 'I', label: 'Integrity', opts: [['H', 'High'], ['L', 'Low'], ['N', 'None']] },
  { id: 'A', label: 'Availability', opts: [['H', 'High'], ['L', 'Low'], ['N', 'None']] },
]

const W = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  UI: { N: 0.85, R: 0.62 },
  C: { H: 0.56, L: 0.22, N: 0 },
  I: { H: 0.56, L: 0.22, N: 0 },
  A: { H: 0.56, L: 0.22, N: 0 },
  PR: {
    U: { N: 0.85, L: 0.62, H: 0.27 },
    C: { N: 0.85, L: 0.68, H: 0.5 },
  },
}

function roundup(x) {
  const i = Math.round(x * 100000)
  return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10
}

function score(v) {
  const isc = 1 - (1 - W.C[v.C]) * (1 - W.I[v.I]) * (1 - W.A[v.A])
  const impact =
    v.S === 'U'
      ? 6.42 * isc
      : 7.52 * (isc - 0.029) - 3.25 * Math.pow(isc - 0.02, 15)
  const expl = 8.22 * W.AV[v.AV] * W.AC[v.AC] * W.PR[v.S][v.PR] * W.UI[v.UI]
  if (impact <= 0) return 0
  const base =
    v.S === 'U'
      ? Math.min(impact + expl, 10)
      : Math.min(1.08 * (impact + expl), 10)
  return roundup(base)
}

function severity(s) {
  if (s === 0) return 'none'
  if (s < 4) return 'low'
  if (s < 7) return 'medium'
  if (s < 9) return 'high'
  return 'critical'
}

export default function CvssCalculator() {
  const [v, setV] = useState({ AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H' })
  const s = score(v)
  const sev = severity(s)
  const vector = `CVSS:3.1/${METRICS.map((m) => `${m.id}:${v[m.id]}`).join('/')}`

  return (
    <div className="cvss">
      <div className="cvss-result">
        <div className={`cvss-score sev-${sev}`}>{s.toFixed(1)}</div>
        <div className="cvss-meta">
          <span className={`cvss-sev sev-${sev}`}>{sev.toUpperCase()}</span>
          <div className="cvss-vector">
            <code>{vector}</code>
            <CopyButton text={vector} />
          </div>
        </div>
      </div>

      <div className="cvss-metrics">
        {METRICS.map((m) => (
          <div className="cvss-group" key={m.id}>
            <span className="cvss-group-label">{m.label}</span>
            <div className="cvss-opts">
              {m.opts.map(([val, name]) => (
                <button
                  key={val}
                  type="button"
                  className={`cvss-opt${v[m.id] === val ? ' active' : ''}`}
                  onClick={() => setV((prev) => ({ ...prev, [m.id]: val }))}
                  title={name}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
