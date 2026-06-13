import { useMemo, useState } from 'react'

function toIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
}

function calc(input) {
  const m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*\/\s*(\d{1,2})\s*$/.exec(input)
  if (!m) return null
  const o = [+m[1], +m[2], +m[3], +m[4]]
  const bits = +m[5]
  if (o.some((x) => x > 255) || bits > 32) return null

  const ip = ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  const net = (ip & mask) >>> 0
  const bc = (net | (~mask >>> 0)) >>> 0
  const size = 2 ** (32 - bits)
  const usable = bits >= 31 ? size : size - 2
  const first = bits >= 31 ? net : (net + 1) >>> 0
  const last = bits >= 31 ? bc : (bc - 1) >>> 0

  return {
    network: toIp(net),
    broadcast: toIp(bc),
    netmask: toIp(mask),
    wildcard: toIp(~mask >>> 0),
    first: toIp(first),
    last: toIp(last),
    usable: usable.toLocaleString(),
    total: size.toLocaleString(),
    cidr: `${toIp(net)}/${bits}`,
  }
}

function Stat({ label, value }) {
  return (
    <div className="subnet-stat">
      <span className="subnet-label">{label}</span>
      <span className="subnet-value">{value}</span>
    </div>
  )
}

export default function SubnetCalculator() {
  const [val, setVal] = useState('10.10.11.0/24')
  const r = useMemo(() => calc(val), [val])

  const stats = r
    ? [
        ['Network', r.network],
        ['Broadcast', r.broadcast],
        ['Netmask', r.netmask],
        ['Wildcard', r.wildcard],
        ['First host', r.first],
        ['Last host', r.last],
        ['Usable hosts', r.usable],
        ['Total addresses', r.total],
        ['CIDR', r.cidr],
      ]
    : []

  return (
    <div className="subnet">
      <label className="rsg-field subnet-input">
        <span>CIDR</span>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="10.10.11.0/24"
          spellCheck="false"
        />
      </label>

      {r ? (
        <div className="subnet-grid" key={r.cidr + r.netmask}>
          {stats.map(([label, value]) => (
            <Stat key={label} label={label} value={value} />
          ))}
        </div>
      ) : (
        <p className="shell-output">
          Enter an IPv4 network in CIDR notation, e.g. <code>10.10.11.0/24</code>.
        </p>
      )}
    </div>
  )
}
