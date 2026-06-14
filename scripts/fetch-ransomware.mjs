// Fetches recently reported ransomware victims (from public leak-site
// monitoring by ransomware.live) and writes a slim, newest-first snapshot to
// src/data/ransomware.json. Runs before every build. CORS-free in Node.
//
// Note: we deliberately do NOT keep the .onion claim URLs — cards link to the
// ransomware.live group profile instead, never to a leak site.
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'ransomware.json')
const API = 'https://api.ransomware.live/v2/recentvictims'
const LIMIT = 42

const clean = (s) => (s && s !== 'Not Found' ? String(s).trim() : '')

try {
  const r = await fetch(API, {
    headers: { 'User-Agent': 'disruption-blog (+https://blog.disruption-academy.com)' },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()

  const items = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => new Date(b.discovered || b.attackdate) - new Date(a.discovered || a.attackdate))
    .slice(0, LIMIT)
    .map((v) => {
      const desc = clean(v.description)
      return {
        victim: clean(v.victim) || 'Undisclosed',
        group: clean(v.group),
        country: clean(v.country),
        sector: clean(v.activity),
        domain: clean(v.domain),
        discovered: v.discovered || '',
        attackdate: v.attackdate || '',
        description: desc.length > 280 ? `${desc.slice(0, 280)}…` : desc,
      }
    })

  const snapshot = { generated: new Date().toISOString(), total: data.length || items.length, items }
  writeFileSync(out, JSON.stringify(snapshot, null, 2))
  console.log(`ransomware.json written (${items.length} recent victims)`)
} catch (e) {
  console.warn(`ransomware.live fetch failed: ${e.message}`)
  if (!existsSync(out)) {
    writeFileSync(out, JSON.stringify({ generated: '', total: 0, items: [] }, null, 2))
    console.warn('wrote empty ransomware.json (fallback)')
  } else {
    console.warn('keeping existing ransomware.json')
  }
}
