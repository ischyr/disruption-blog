// Writes a static HTML file for every post and main page into dist/, each a
// copy of the built index.html with its own <title>, description, canonical
// URL, Open Graph / Twitter tags and (for posts) the cover image + JSON-LD.
// Runs after every build (postbuild).
//
// Why: GitHub Pages has no SPA routing, so /blog/<slug> used to be served by
// the 404.html fallback — with an HTTP 404 status and the generic home title.
// Search engines skipped those pages and LinkedIn/Discord showed no preview.
// With a real file per route, each URL returns 200 and carries its own tags;
// the React app still boots from the same scripts and takes over as usual.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { site } from '../src/config.js'
import { buildMeta } from '../src/lib/postMeta.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const postsDir = join(root, 'src/posts')

let base = 'https://blog.disruption-academy.com'
try {
  const cname = readFileSync(join(root, 'public/CNAME'), 'utf8').trim()
  if (cname) base = `https://${cname.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
} catch {
  /* fall back to default */
}

// same format as pageTitle() in src/lib/useTitle.js
const pageTitle = (title) => (title ? `${title} · ${site.handle}` : site.title)

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// one line, at most ~200 chars, cut at a word boundary
function describe(text) {
  const plain = String(text || '').replace(/\s+/g, ' ').trim()
  if (plain.length <= 200) return plain
  return `${plain.slice(0, 197).replace(/\s+\S*$/, '')}…`
}

// width/height from a PNG header, so previews can reserve the right shape
function pngSize(file) {
  try {
    const buf = readFileSync(file)
    if (buf.toString('ascii', 1, 4) !== 'PNG') return null
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  } catch {
    return null
  }
}

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const manifestPath = join(dist, '.vite/manifest.json')
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

function render({ title, description, path, image, type = 'website', extra = '' }) {
  const url = `${base}${path}`
  const fullTitle = pageTitle(title)
  const img = image || { url: `${base}/avatar.jpg` }
  const tags = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${esc(site.handle)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title || site.title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img.url)}" />`,
    img.width ? `<meta property="og:image:width" content="${img.width}" />` : '',
    img.height ? `<meta property="og:image:height" content="${img.height}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(title || site.title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img.url)}" />`,
    extra,
  ].filter(Boolean)

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${esc(description)}" />`
    )
    .replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
}

function write(file, html) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

// ── main pages ─────────────────────────────────────────────────────────
const pages = [
  { path: '/', title: null, description: site.tagline },
  { path: '/about', title: 'About', description: site.about[0] },
  { path: '/blog', title: 'Blog', description: 'Every write-up and research post — CTF boxes, red team research, exploit development and cheat sheets.' },
  { path: '/start-here', title: 'Start Here', description: 'A learning roadmap for offensive security, from fundamentals to exploit development.' },
  { path: '/glossary', title: 'Glossary', description: 'Offensive security and Active Directory terms, explained briefly.' },
  { path: '/ctf', title: 'CTF Events', description: 'Upcoming and ongoing CTF competitions.' },
  { path: '/saved', title: 'Saved', description: 'Posts you saved for later.' },
]

for (const page of pages) {
  const html = render(page)
  if (page.path === '/') {
    write(join(dist, 'index.html'), html)
  } else {
    // GitHub Pages serves /about from about.html. /blog also gets
    // blog/index.html, since the post files below create a blog/ folder.
    write(join(dist, `${page.path.slice(1)}.html`), html)
    if (page.path === '/blog') write(join(dist, 'blog/index.html'), html)
  }
}

// ── posts ──────────────────────────────────────────────────────────────
let count = 0
for (const entry of readdirSync(postsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const dir = join(postsDir, entry.name)
  const md = readdirSync(dir).find((f) => f.toLowerCase().endsWith('.md'))
  if (!md) continue
  const meta = buildMeta(readFileSync(join(dir, md), 'utf8'), entry.name)

  // preview image: an `og.png` in the post folder wins (social sites don't
  // accept SVG, so SVG covers ship a PNG render as og.png), else the cover
  let image = null
  const asset = (name) => manifest[`src/posts/${entry.name}/${name}`]
  const cover =
    asset('og.png') || (meta.image && !/\.svg$/i.test(meta.image) && asset(meta.image))
  if (cover) {
    image = { url: `${base}/${cover.file}`, ...(pngSize(join(dist, cover.file)) || {}) }
  }

  const description = describe(meta.excerpt)
  const path = `/blog/${entry.name}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description,
    datePublished: meta.date,
    author: { '@type': 'Person', name: site.handle, url: `${base}/about` },
    mainEntityOfPage: `${base}${path}`,
    keywords: meta.tags.join(', '),
    ...(image ? { image: [image.url] } : {}),
  }

  const extra = [
    `<meta property="article:published_time" content="${esc(meta.date)}" />`,
    ...meta.tags.map((t) => `<meta property="article:tag" content="${esc(t)}" />`),
    // escape "<" so the JSON can't close the script tag
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')

  write(
    join(dist, 'blog', `${entry.name}.html`),
    render({ title: meta.title, description, path, image, type: 'article', extra })
  )
  count++
}

// the manifest was only needed to resolve cover URLs; don't publish it
rmSync(join(dist, '.vite'), { recursive: true, force: true })

console.log(`gen-pages: wrote ${count} post pages + ${pages.length} main pages`)
