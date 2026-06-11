import GithubSlugger from 'github-slugger'

// Strip inline markdown so the slug we compute matches the *rendered* text
// content that rehype-slug slugs (inline code, emphasis, links, html).
function stripInline(s) {
  return s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// Extract H1–H3 headings (in document order) with the same ids rehype-slug
// assigns to the rendered content, so anchor links line up perfectly.
// We slug every heading level to keep the duplicate-counter in lockstep with
// rehype-slug, but only return depths 1–3 for the table of contents.
export function extractHeadings(markdown) {
  const slugger = new GithubSlugger()
  const headings = []
  let inFence = false
  let fenceMarker = ''

  for (const line of markdown.split(/\r?\n/)) {
    const fence = /^\s*(```+|~~~+)/.exec(line)
    if (fence) {
      const marker = fence[1][0]
      if (!inFence) {
        inFence = true
        fenceMarker = marker
      } else if (marker === fenceMarker) {
        inFence = false
        fenceMarker = ''
      }
      continue
    }
    if (inFence) continue

    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!m) continue

    const depth = m[1].length
    const text = stripInline(m[2])
    if (!text) continue

    const id = slugger.slug(text) // advances duplicate counter for every level
    if (depth <= 3) headings.push({ depth, text, id })
  }

  return headings
}
