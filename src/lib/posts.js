// Loads every post in src/posts/. Each post lives in its OWN folder named
// after the post, holding the markdown file plus any images:
//
//   src/posts/
//     welcome-to-the-blog/
//       welcome-to-the-blog.md
//       welcome-cover.png
//       diagram.png
//
// The folder name is the post slug (its URL is /blog/<folder>).
//
// A post file looks like:
//
//   ---
//   title: My Post Title
//   date: 2026-06-08
//   image: welcome-cover.png        # cover photo (file in this folder)
//   tags: [OSINT, Phishing]
//   excerpt: Short description shown on the blog cards.
//   ---
//
//   # Markdown content here...
//
//   Reference images from this folder inline with: {% diagram %}

const files = import.meta.glob('../posts/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Images co-located with posts → resolved to bundled (hashed) URLs.
const imageFiles = import.meta.glob('../posts/*/*.{png,jpg,jpeg,gif,webp,avif,svg}', {
  query: '?url',
  import: 'default',
  eager: true,
})

const IMG_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg']

function folderOf(path) {
  const parts = path.split('/')
  return parts[parts.length - 2]
}

function imagesForFolder(folder) {
  const map = {}
  for (const [path, url] of Object.entries(imageFiles)) {
    if (folderOf(path) === folder) {
      map[path.split('/').pop()] = url
    }
  }
  return map
}

// Find an image url by file name, with or without extension, case-insensitive.
export function lookupImage(images, key) {
  const k = String(key).trim()
  if (images[k]) return images[k]
  for (const ext of IMG_EXT) {
    if (images[`${k}.${ext}`]) return images[`${k}.${ext}`]
  }
  const lower = k.toLowerCase()
  for (const [name, url] of Object.entries(images)) {
    if (name.toLowerCase() === lower) return url
    if (name.replace(/\.[^.]+$/, '').toLowerCase() === lower) return url
  }
  return null
}

// Replace `{% name %}` tags with markdown images, skipping fenced code blocks
// so documentation/code examples containing the tag stay literal.
export function resolveImages(body, images) {
  if (!images) return body
  const lines = body.split(/\r?\n/)
  let inFence = false
  let marker = ''
  for (let i = 0; i < lines.length; i++) {
    const fence = /^\s*(```+|~~~+)/.exec(lines[i])
    if (fence) {
      const mk = fence[1][0]
      if (!inFence) {
        inFence = true
        marker = mk
      } else if (mk === marker) {
        inFence = false
        marker = ''
      }
      continue
    }
    if (inFence) continue
    lines[i] = lines[i].replace(/\{%\s*([^%}]+?)\s*%\}/g, (m, raw) => {
      const url = lookupImage(images, raw)
      if (!url) return m // leave the tag visible if the image is missing
      const alt = raw.trim().replace(/\.[^.]+$/, '')
      return `![${alt}](${url})`
    })
  }
  return lines.join('\n')
}

function parseFrontmatter(raw) {
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

function readTime(text) {
  const words = text.trim().split(/\s+/).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
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

export const posts = Object.entries(files)
  .map(([path, raw]) => {
    const slug = folderOf(path)
    const images = imagesForFolder(slug)
    const { meta, body } = parseFrontmatter(raw)

    // Cover: a folder image name, an absolute /public path, or an external URL.
    let cover = meta.image || meta.cover || ''
    if (cover && !/^https?:\/\//i.test(cover) && !cover.startsWith('/')) {
      cover = lookupImage(images, cover) || cover
    }

    return {
      slug,
      title: meta.title || slug,
      date: meta.date || '1970-01-01',
      tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
      excerpt: meta.excerpt || autoExcerpt(body),
      image: cover,
      images,
      readTime: readTime(body),
      body,
    }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export const getPost = (slug) => posts.find((p) => p.slug === slug)

// Posts most related to `slug` by shared tags, falling back to recency to fill
// up to `n` results.
export function relatedPosts(slug, n = 5) {
  const current = getPost(slug)
  if (!current) return []
  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      p,
      score: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score || new Date(b.p.date) - new Date(a.p.date))
    .slice(0, n)
    .map((s) => s.p)
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
