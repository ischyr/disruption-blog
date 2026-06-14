// Fetches recent high-severity CVEs from the NVD API (v2.0) and writes a slim,
// newest-first snapshot to src/data/cves.json. Runs before every build so the
// /cves page stays current. CORS-free in Node; no API key needed (the public
// rate limit of 5 req / 30s is plenty for two requests).
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'cves.json')
const BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0'
const DAYS = 30 // NVD caps a single query window at 120 days
const PER_SEVERITY = 40
const TOTAL = 45
const UA = { 'User-Agent': 'disruption-blog (+https://blog.disruption-academy.com)' }

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

const end = new Date()
const start = new Date(end.getTime() - DAYS * 86400 * 1000)
const iso = (d) => d.toISOString().replace(/\.\d+Z$/, '.000')

function pickMetric(metrics = {}) {
  // prefer NVD's Primary scoring over a CNA's Secondary one, newest CVSS first
  for (const group of [metrics.cvssMetricV31, metrics.cvssMetricV30, metrics.cvssMetricV2]) {
    if (!group?.length) continue
    const m = group.find((x) => x.type === 'Primary') || group[0]
    const d = m.cvssData || {}
    return {
      score: d.baseScore ?? null,
      severity: (d.baseSeverity || m.baseSeverity || 'UNKNOWN').toUpperCase(),
      vector: d.vectorString || '',
    }
  }
  return { score: null, severity: 'UNKNOWN', vector: '' }
}

async function fetchSeverity(severity) {
  const params = new URLSearchParams({
    pubStartDate: iso(start),
    pubEndDate: iso(end),
    cvssV3Severity: severity,
    resultsPerPage: String(PER_SEVERITY),
    startIndex: '0',
    noRejected: '',
  })
  const r = await fetch(`${BASE}?${params}`, { headers: UA })
  if (!r.ok) throw new Error(`HTTP ${r.status} (${severity})`)
  const data = await r.json()
  return (data.vulnerabilities || []).map(({ cve }) => {
    const { score, severity: sev, vector } = pickMetric(cve.metrics)
    return {
      id: cve.id,
      published: cve.published,
      description:
        cve.descriptions?.find((x) => x.lang === 'en')?.value ||
        cve.descriptions?.[0]?.value ||
        '',
      cwe:
        cve.weaknesses?.[0]?.description?.find((x) => x.lang === 'en')?.value || '',
      severity: sev,
      score,
      vector,
    }
  })
}

try {
  const critical = await fetchSeverity('CRITICAL')
  await sleep(6500) // stay well under the 5-req / 30s public limit
  const high = await fetchSeverity('HIGH')

  const seen = new Set()
  const items = [...critical, ...high]
    .filter((c) => (seen.has(c.id) ? false : seen.add(c.id)))
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, TOTAL)

  const snapshot = { window: `${DAYS}d`, generated: new Date().toISOString(), items }
  writeFileSync(out, JSON.stringify(snapshot, null, 2))
  console.log(`cves.json written (${items.length} high-severity CVEs)`)
} catch (e) {
  console.warn(`NVD fetch failed: ${e.message}`)
  if (!existsSync(out)) {
    writeFileSync(out, JSON.stringify({ window: `${DAYS}d`, generated: '', items: [] }, null, 2))
    console.warn('wrote empty cves.json (fallback)')
  } else {
    console.warn('keeping existing cves.json')
  }
}
