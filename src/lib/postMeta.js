// Pure, dependency-free helpers for turning a raw markdown post into the small
// metadata object the blog listing needs. Shared by two callers:
//   - the Vite plugin (Node, build time) → builds the `virtual:post-meta` index
//   - the app (src/lib/posts.js) → resolves image URLs onto that index
//
// Keeping the parsing here (and out of the browser bundle's hot path) means the
// listing pages never have to ship or parse the full body of every post.

export function folderOf(path) {
  const parts = path.split('/')
  return parts[parts.length - 2]
}

export function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { meta: {}, body: raw }

  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (/^\[.*\]$/.test(value)) {
      meta[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      meta[key] = value.replace(/^["']|["']$/g, '')
    }
  }
  return { meta, body: raw.slice(match[0].length) }
}

export function readTime(text) {
  const words = text.trim().split(/\s+/).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

export function autoExcerpt(body) {
  const plain = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{%[^%}]*%\}/g, '')
    .replace(/[#>*_`[\]()!-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain
}

// Short raw-markdown teaser for the home page's featured card.
export function buildPreview(body) {
  return body.trim().slice(0, 280)
}

// Build the listing-sized metadata for one post. Image fields stay as their raw
// frontmatter names here; the app resolves them to hashed asset URLs because
// only Vite (not this Node-side helper) knows the bundled image paths.
export function buildMeta(raw, slug) {
  const { meta, body } = parseFrontmatter(raw)

  const machineKeys = ['os', 'difficulty', 'points', 'platform', 'released', 'ip']
  let machine = null
  if (machineKeys.some((k) => meta[k])) {
    machine = {
      os: meta.os || '',
      difficulty: meta.difficulty || '',
      points: meta.points || '',
      platform: meta.platform || '',
      released: meta.released || '',
      ip: meta.ip || '',
      avatar: meta.boxAvatar || meta.avatar || '',
    }
  }

  return {
    slug,
    title: meta.title || slug,
    date: meta.date || '1970-01-01',
    tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
    excerpt: meta.excerpt || autoExcerpt(body),
    preview: buildPreview(body),
    readTime: readTime(body),
    image: meta.image || meta.cover || '',
    machine,
  }
}
