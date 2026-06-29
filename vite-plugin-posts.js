// Build-time index of post metadata, served as the `virtual:post-meta` module.
//
// Each post folder under src/posts/ is scanned once, its frontmatter parsed and
// its excerpt / read-time / preview computed. Only this lightweight metadata is
// emitted into the bundle — the (potentially large) markdown bodies are loaded
// lazily and per-post via a dynamic import.meta.glob in src/lib/posts.js, so the
// listing pages stay small no matter how many posts exist.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { buildMeta } from './src/lib/postMeta.js'

const VIRTUAL_ID = 'virtual:post-meta'
const RESOLVED_ID = '\0' + VIRTUAL_ID

export default function postsMetaPlugin() {
  const postsDir = resolve(process.cwd(), 'src/posts')

  const collect = () => {
    let entries
    try {
      entries = readdirSync(postsDir, { withFileTypes: true })
    } catch {
      return [] // no posts dir yet
    }

    const out = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dir = join(postsDir, entry.name)
      const md = readdirSync(dir).find((f) => f.toLowerCase().endsWith('.md'))
      if (!md) continue
      const raw = readFileSync(join(dir, md), 'utf8')
      out.push(buildMeta(raw, entry.name))
    }
    // newest first, matching the app's ordering
    out.sort((a, b) => new Date(b.date) - new Date(a.date))
    return out
  }

  return {
    name: 'posts-meta',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id === RESOLVED_ID) {
        return `export default ${JSON.stringify(collect())}`
      }
    },

    configureServer(server) {
      const isPost = (file) =>
        file.replace(/\\/g, '/').includes('/src/posts/') && file.endsWith('.md')

      const refresh = (file) => {
        if (!isPost(file)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.add(postsDir)
      server.watcher.on('add', refresh)
      server.watcher.on('change', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}
