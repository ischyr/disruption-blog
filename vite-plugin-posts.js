// Build-time indexes of the posts, served as virtual modules:
//
//  - `virtual:post-meta`: frontmatter, excerpt, read-time and preview for every
//    post. Only this lightweight metadata is emitted into the main bundle — the
//    (potentially large) markdown bodies are loaded lazily and per-post via a
//    dynamic import.meta.glob in src/lib/posts.js, so the listing pages stay
//    small no matter how many posts exist.
//  - `virtual:command-index`: every shell command in every post (see
//    src/lib/commands.js), for the Ctrl+K palette. It is only ever imported
//    dynamically, so it becomes its own chunk fetched when the palette opens.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { buildMeta, lockPassword, parseFrontmatter } from './src/lib/postMeta.js'
import { extractCommands } from './src/lib/commands.js'

const META_ID = 'virtual:post-meta'
const COMMANDS_ID = 'virtual:command-index'
const RESOLVED = { [META_ID]: '\0' + META_ID, [COMMANDS_ID]: '\0' + COMMANDS_ID }

export default function postsMetaPlugin() {
  const postsDir = resolve(process.cwd(), 'src/posts')

  // [{ slug, raw }] for every post folder that has a markdown file
  const readPosts = () => {
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
      out.push({ slug: entry.name, raw: readFileSync(join(dir, md), 'utf8') })
    }
    return out
  }

  const collectMeta = () =>
    readPosts()
      .map(({ slug, raw }) => {
        const meta = buildMeta(raw, slug)
        // locked posts ship a SHA-256 of their password, never the password
        const password = lockPassword(parseFrontmatter(raw).meta)
        if (password) meta.lockHash = createHash('sha256').update(password).digest('hex')
        return meta
      })
      // newest first, matching the app's ordering
      .sort((a, b) => new Date(b.date) - new Date(a.date))

  const collectCommands = () =>
    readPosts()
      .map(({ slug, raw }) => {
        const { meta, body } = parseFrontmatter(raw)
        // locked posts stay out of the Ctrl+K command search
        if (lockPassword(meta)) return { commands: [] }
        const commands = extractCommands(body).map(({ tool, cmd, raw: text }) =>
          // `raw` (the on-page text) is usually the command itself; skip the dupe
          text === cmd ? { tool, cmd } : { tool, cmd, raw: text }
        )
        return { slug, title: meta.title || slug, date: meta.date || '', commands }
      })
      .filter((p) => p.commands.length > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

  return {
    name: 'posts-meta',
    enforce: 'pre',

    resolveId(id) {
      return RESOLVED[id]
    },

    load(id) {
      if (id === RESOLVED[META_ID]) return `export default ${JSON.stringify(collectMeta())}`
      if (id === RESOLVED[COMMANDS_ID]) {
        return `export default ${JSON.stringify(collectCommands())}`
      }
      // post bodies are bundled as raw markdown (?raw), frontmatter included;
      // drop the `active:` line so a locked post's password never ships
      const file = id.replace(/\?raw$/, '')
      if (id.endsWith('.md?raw') && file.replace(/\\/g, '/').includes('/src/posts/')) {
        const text = readFileSync(file, 'utf8').replace(/^active:.*\r?\n/m, '')
        return `export default ${JSON.stringify(text)}`
      }
    },

    configureServer(server) {
      const isPost = (file) =>
        file.replace(/\\/g, '/').includes('/src/posts/') && file.endsWith('.md')

      const refresh = (file) => {
        if (!isPost(file)) return
        for (const resolved of Object.values(RESOLVED)) {
          const mod = server.moduleGraph.getModuleById(resolved)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.add(postsDir)
      server.watcher.on('add', refresh)
      server.watcher.on('change', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}
