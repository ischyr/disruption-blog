// Fetches the next 10 upcoming CTFs from CTFtime and writes a slim snapshot to
// src/data/ctf-events.json. Runs automatically before every build (prebuild),
// so the /ctf page is fresh on each deploy. CORS-free because it runs in Node.
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'ctf-events.json')
const now = Math.floor(Date.now() / 1000)
const api = `https://ctftime.org/api/v1/events/?limit=10&start=${now}&finish=${now + 120 * 86400}`

try {
  const r = await fetch(api, { headers: { 'User-Agent': 'disruption-blog (+https://blog.disruption-academy.com)' } })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()
  const slim = data.slice(0, 10).map((e) => ({
    id: e.id,
    title: e.title,
    ctftime_url: e.ctftime_url,
    url: e.url,
    start: e.start,
    finish: e.finish,
    format: e.format,
    onsite: e.onsite,
    location: e.location,
    restrictions: e.restrictions,
    weight: e.weight,
    participants: e.participants,
    logo: e.logo,
  }))
  writeFileSync(out, JSON.stringify(slim, null, 2))
  console.log(`ctf-events.json written (${slim.length} events)`)
} catch (e) {
  console.warn(`CTFtime fetch failed: ${e.message}`)
  if (!existsSync(out)) {
    writeFileSync(out, '[]')
    console.warn('wrote empty ctf-events.json (fallback)')
  } else {
    console.warn('keeping existing ctf-events.json')
  }
}
