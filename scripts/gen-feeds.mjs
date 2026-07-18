// Generates public/feed.xml (RSS 2.0), public/sitemap.xml and public/robots.txt
// from the posts in src/posts/. Runs before every build (prebuild). The base
// URL is read from public/CNAME so it always matches the deployed domain.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { site } from '../src/config.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const postsDir = join(root, 'src', 'posts')
const publicDir = join(root, 'public')

let base = 'https://blog.disruption-academy.com'
try {
  const cname = readFileSync(join(publicDir, 'CNAME'), 'utf8').trim()
  if (cname) base = `https://${cname.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
} catch {
  /* fall back to default */
}

const STATIC_ROUTES = [
  '',
  'about',
  'blog',
  'tools',
  'videos',
  'glossary',
  'graph',
  'start-here',
  'ctf',
]

function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!m) return { meta: {}, body: raw }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let v = line.slice(idx + 1).trim()
    if (/^\[.*\]$/.test(v)) {
      meta[key] = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      meta[key] = v.replace(/^["']|["']$/g, '')
    }
  }
  return { meta, body: raw.slice(m[0].length) }
}

function autoExcerpt(body) {
  const plain = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{%[^%}]*%\}/g, '')
    .replace(/[#>*_`[\]()!-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// collect posts
const posts = []
for (const name of readdirSync(postsDir)) {
  const dir = join(postsDir, name)
  if (!statSync(dir).isDirectory()) continue
  const md = readdirSync(dir).find((f) => f.endsWith('.md'))
  if (!md) continue
  const { meta, body } = parseFrontmatter(readFileSync(join(dir, md), 'utf8'))
  posts.push({
    slug: name,
    title: meta.title || name,
    date: meta.date || '1970-01-01',
    excerpt: meta.excerpt || autoExcerpt(body),
    tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
  })
}
posts.sort((a, b) => new Date(b.date) - new Date(a.date))

// ── RSS ──
const items = posts
  .map(
    (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
      <description>${esc(p.excerpt)}</description>
    </item>`
  )
  .join('\n')

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.title)}</title>
    <link>${base}/</link>
    <description>${esc(site.tagline)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
writeFileSync(join(publicDir, 'feed.xml'), rss)

// ── sitemap ──
const urls = [
  ...STATIC_ROUTES.map((r) => `  <url><loc>${base}/${r}</loc></url>`),
  ...posts.map(
    (p) =>
      `  <url><loc>${base}/blog/${p.slug}</loc><lastmod>${p.date}</lastmod></url>`
  ),
].join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
writeFileSync(join(publicDir, 'sitemap.xml'), sitemap)

// ── robots ──
writeFileSync(
  join(publicDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
)

console.log(`feeds: ${posts.length} posts → feed.xml, sitemap.xml, robots.txt (${base})`)
