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
//
// PERFORMANCE: the listing only needs metadata, so the (often large) markdown
// BODIES are NOT eagerly bundled. `virtual:post-meta` (see vite-plugin-posts.js)
// ships a tiny frontmatter index, and each body is fetched on demand via
// `loadPostBody` — one code-split chunk per post. This keeps the initial bundle
// flat regardless of how many posts the blog grows to.
import meta from 'virtual:post-meta'
import { folderOf, parseFrontmatter } from './postMeta'

// Co-located post images → bundled (hashed) URLs. Just a small map of
// filename → URL string; the image files themselves load lazily via <img>.
const imageFiles = import.meta.glob('../posts/*/*.{png,jpg,jpeg,gif,webp,avif,svg}', {
  query: '?url',
  import: 'default',
  eager: true,
})

// Lazy (NON-eager) loaders for the raw markdown — each becomes its own chunk,
// downloaded only when that post is opened.
const bodyLoaders = import.meta.glob('../posts/*/*.md', {
  query: '?raw',
  import: 'default',
})

const loaderBySlug = {}
for (const [path, loader] of Object.entries(bodyLoaders)) {
  loaderBySlug[folderOf(path)] = loader
}

const IMG_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg']

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

// Resolve a raw frontmatter image name to a bundled URL (passes through
// absolute /public paths and external URLs untouched).
function resolveCover(name, images) {
  if (!name) return ''
  if (/^https?:\/\//i.test(name) || name.startsWith('/')) return name
  return lookupImage(images, name) || name
}

export const posts = meta
  .map((m) => {
    const images = imagesForFolder(m.slug)
    const machine = m.machine
      ? { ...m.machine, avatar: resolveCover(m.machine.avatar, images) }
      : null

    return {
      ...m,
      image: resolveCover(m.image, images),
      images,
      machine,
    }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export const getPost = (slug) => posts.find((p) => p.slug === slug)

// Fetch and return a post's raw markdown body (without frontmatter). The body
// lives in its own chunk, so this resolves a network/disk fetch the first time
// a given post is opened, then is cached by the bundler/browser.
export async function loadPostBody(slug) {
  const loader = loaderBySlug[slug]
  if (!loader) return ''
  const raw = await loader()
  return parseFrontmatter(raw).body
}

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
