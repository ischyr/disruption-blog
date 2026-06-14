// Fetches CISA's Known Exploited Vulnerabilities catalog and writes a slim,
// newest-first snapshot to src/data/cisa-kev.json. Runs before every build
// (prebuild) so the /kev board is fresh on each deploy. CORS-free in Node.
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'cisa-kev.json')
const FEED = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
const LIMIT = 30

try {
  const r = await fetch(FEED, {
    headers: { 'User-Agent': 'disruption-blog (+https://blog.disruption-academy.com)' },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()

  const items = (data.vulnerabilities || [])
    .slice()
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, LIMIT)
    .map((v) => ({
      cveID: v.cveID,
      vendor: v.vendorProject,
      product: v.product,
      name: v.vulnerabilityName,
      dateAdded: v.dateAdded,
      dueDate: v.dueDate,
      description: v.shortDescription,
      action: v.requiredAction,
      ransomware: /known/i.test(v.knownRansomwareCampaignUse || ''),
    }))

  const snapshot = {
    version: data.catalogVersion || '',
    released: data.dateReleased || '',
    total: data.count || (data.vulnerabilities || []).length,
    items,
  }

  writeFileSync(out, JSON.stringify(snapshot, null, 2))
  console.log(`cisa-kev.json written (${items.length} of ${snapshot.total} entries)`)
} catch (e) {
  console.warn(`CISA KEV fetch failed: ${e.message}`)
  if (!existsSync(out)) {
    writeFileSync(out, JSON.stringify({ version: '', released: '', total: 0, items: [] }, null, 2))
    console.warn('wrote empty cisa-kev.json (fallback)')
  } else {
    console.warn('keeping existing cisa-kev.json')
  }
}
