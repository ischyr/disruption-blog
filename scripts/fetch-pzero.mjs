// Fetches Google Project Zero's "0day In the Wild" tracker — a public Google
// Sheet of vulnerabilities confirmed exploited in the wild as zero-days — and
// writes a slim, newest-first snapshot to src/data/pzero-0day.json. Runs before
// every build. CORS-free in Node.
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'pzero-0day.json')
const SHEET_ID = '1lkNJ0uQwbeC1ZTRrxdtuPLCIl7mlUreoKfSIgajnSyY'
const ALL_GID = '1190662839' // the "All" tab (every year, newest first)
const CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${ALL_GID}`
const LIMIT = 80

// RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, embedded
// commas and newlines.
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

const blank = (s) => !s || /^\?+$/.test(s.trim()) // treat "???" as empty
const val = (s) => (blank(s) ? '' : s.trim())

try {
  const r = await fetch(CSV, {
    headers: { 'User-Agent': 'Mozilla/5.0 disruption-blog (+https://blog.disruption-academy.com)' },
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const rows = parseCSV(await r.text())

  // header row is the one that starts with "CVE"
  const headIdx = rows.findIndex((row) => row[0]?.trim() === 'CVE')
  if (headIdx === -1) throw new Error('header row not found')
  const head = rows[headIdx].map((h) => h.trim())
  const col = (name) => head.indexOf(name)

  const c = {
    cve: col('CVE'),
    vendor: col('Vendor'),
    product: col('Product'),
    type: col('Type'),
    desc: col('Description'),
    discovered: col('Date Discovered'),
    patched: col('Date Patched'),
    advisory: col('Advisory'),
    analysis: col('Analysis URL'),
  }

  const items = rows
    .slice(headIdx + 1)
    .filter((row) => /^CVE-\d{4}-\d+/i.test(row[c.cve]?.trim() || ''))
    .map((row) => {
      const cve = row[c.cve].trim()
      const patched = val(row[c.patched])
      const discovered = val(row[c.discovered])
      const yearMatch = (patched || discovered).match(/(\d{4})/) || cve.match(/CVE-(\d{4})/)
      return {
        cve,
        vendor: val(row[c.vendor]),
        product: val(row[c.product]),
        type: val(row[c.type]),
        description: val(row[c.desc]),
        discovered,
        patched,
        advisory: val(row[c.advisory]),
        analysis: val(row[c.analysis]),
        year: yearMatch ? yearMatch[1] : '',
      }
    })
    .slice(0, LIMIT)

  const snapshot = {
    generated: new Date().toISOString(),
    source: `https://docs.google.com/spreadsheets/d/${SHEET_ID}`,
    items,
  }
  writeFileSync(out, JSON.stringify(snapshot, null, 2))
  console.log(`pzero-0day.json written (${items.length} in-the-wild 0-days)`)
} catch (e) {
  console.warn(`Project Zero fetch failed: ${e.message}`)
  if (!existsSync(out)) {
    writeFileSync(out, JSON.stringify({ generated: '', source: '', items: [] }, null, 2))
    console.warn('wrote empty pzero-0day.json (fallback)')
  } else {
    console.warn('keeping existing pzero-0day.json')
  }
}
