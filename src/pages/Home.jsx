import { Link } from 'react-router-dom'
import { site } from '../config'
import { posts, formatDate } from '../lib/posts'
import { certs } from '../data/certs'
import ContributionHeatmap from '../components/ContributionHeatmap'
import Reveal from '../components/Reveal'
import Typewriter from '../components/Typewriter'
import { IS_MAC, openPalette } from '../lib/palette'
import { useTitle } from '../lib/useTitle'

// Tags that describe *where* a box came from and *how hard* it was — pulled
// out of the generic tag list so the home page can show them as metadata.
const PLATFORMS = ['HackTheBox', 'HackSmarter', 'Ronin']
const LEVELS = ['Easy', 'Medium', 'Hard', 'Insane']

const platformOf = (p) => p.tags.find((t) => PLATFORMS.includes(t))
const levelOf = (p) => p.tags.find((t) => LEVELS.includes(t))

const tagLink = (tag) => `/blog?tag=${encodeURIComponent(tag)}`

// The post list is fixed at build time, so the counts are worked out once.
const STATS = (() => {
  const counts = new Map()
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) || 0) + 1)

  const topics = [...counts]
    .filter(([t]) => !LEVELS.includes(t))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const levels = LEVELS.map((l) => [l, counts.get(l) || 0]).filter(([, n]) => n > 0)

  return {
    topics,
    maxTopic: topics[0]?.[1] || 1,
    levels,
    levelTotal: levels.reduce((s, [, n]) => s + n, 0) || 1,
    boxes: posts.filter(platformOf).length,
  }
})()

function SectionHead({ num, title, to, label }) {
  return (
    <header className="h-head">
      <span className="h-head-num">{num}</span>
      <h2 className="h-head-title">{title}</h2>
      {to && (
        <Link to={to} className="h-head-link">
          {label} <span aria-hidden="true">→</span>
        </Link>
      )}
    </header>
  )
}

function Level({ level }) {
  if (!level) return null
  return <span className={`h-level h-level-${level.toLowerCase()}`}>{level}</span>
}

export default function Home() {
  useTitle()
  const [featured, ...rest] = posts
  const next = rest.slice(0, 6)

  const { topics, maxTopic, levels, levelTotal, boxes } = STATS

  return (
    <div className="page home">
      {/* ── masthead ─────────────────────────────────────────────── */}
      <section className="h-hero">
        <div className="h-art" aria-hidden="true" />

        <div className="h-hero-copy">
          <p className="h-kicker">
            <span className="h-kicker-dot" />
            {site.handle} <span className="h-kicker-sep">/</span> {site.role}
          </p>

          <h1 className="h-title">
            Exploits, write-ups
            <br />
            &amp; research.{' '}
            <span className="h-title-dim">
              Documented<span className="h-accent">.</span>
            </span>
          </h1>

          <p className="h-lede">
            I specialize in <Typewriter phrases={site.specialties} />
          </p>

          <div className="h-actions">
            <Link to="/blog" className="btn btn-primary">
              Read the write-ups <span aria-hidden="true">→</span>
            </Link>
            <button type="button" className="btn h-search-btn" onClick={openPalette}>
              Search posts &amp; commands
              <kbd>{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
            </button>
          </div>
        </div>

        <dl className="h-meta">
          <div>
            <dt>Write-ups</dt>
            <dd>{posts.length}</dd>
          </div>
          <div>
            <dt>Boxes pwned</dt>
            <dd>{boxes}</dd>
          </div>
          <div>
            <dt>Certifications</dt>
            <dd>{certs.length}</dd>
          </div>
          <div>
            <dt>Last post</dt>
            <dd className="h-meta-date">{featured ? formatDate(featured.date) : '—'}</dd>
          </div>
        </dl>
      </section>

      {/* ── latest: one feature + a numbered index ───────────────── */}
      {featured && (
        <Reveal>
          <section className="h-section">
            <SectionHead num="01" title="Latest" to="/blog" label="All posts" />

            <div className="h-latest">
              <Link to={`/blog/${featured.slug}`} className="h-feature">
                {featured.image && (
                  <div className="h-feature-cover">
                    <img src={featured.image} alt="" loading="lazy" decoding="async" />
                  </div>
                )}
                <div className="h-feature-body">
                  <div className="h-feature-meta">
                    {platformOf(featured) && <span>{platformOf(featured)}</span>}
                    <Level level={levelOf(featured)} />
                    <span className="h-feature-date">
                      {formatDate(featured.date)} · {featured.readTime}
                    </span>
                  </div>
                  <h3 className="h-feature-title">{featured.title}</h3>
                  {featured.excerpt && <p className="h-feature-excerpt">{featured.excerpt}</p>}
                  <span className="h-feature-cta">
                    Read the write-up <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>

              <ol className="h-index">
                {next.map((p, i) => (
                  <li key={p.slug}>
                    <Link to={`/blog/${p.slug}`} className="h-index-row">
                      <span className="h-index-num">{String(i + 2).padStart(2, '0')}</span>
                      <span className="h-index-main">
                        <span className="h-index-title">{p.title}</span>
                        <span className="h-index-meta">
                          {platformOf(p) || p.tags[0]}
                          {levelOf(p) && <> · {levelOf(p)}</>} · {formatDate(p.date)}
                        </span>
                      </span>
                      <span className="h-index-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </Reveal>
      )}

      {/* ── browse by topic, with the difficulty mix ─────────────── */}
      <Reveal>
        <section className="h-section">
          <SectionHead num="02" title="Browse by topic" to="/blog" label="Every tag" />

          <div className="h-topics">
            {topics.map(([tag, n]) => (
              <Link key={tag} to={tagLink(tag)} className="h-topic">
                <span className="h-topic-count">{n}</span>
                <span className="h-topic-label">{tag}</span>
                <span className="h-topic-bar" style={{ '--w': `${(n / maxTopic) * 100}%` }} />
              </Link>
            ))}
          </div>

          {levels.length > 0 && (
            <div className="h-levels">
              <span className="h-levels-label">Difficulty mix</span>
              <div className="h-levels-bar" role="img" aria-label="Write-ups by difficulty">
                {levels.map(([l, n]) => (
                  <Link
                    key={l}
                    to={tagLink(l)}
                    className={`h-levels-seg h-level-${l.toLowerCase()}`}
                    style={{ flexGrow: n / levelTotal }}
                    title={`${l}: ${n}`}
                  />
                ))}
              </div>
              <div className="h-levels-legend">
                {levels.map(([l, n]) => (
                  <Link key={l} to={tagLink(l)} className="h-levels-key">
                    <span className={`h-levels-swatch h-level-${l.toLowerCase()}`} />
                    {l} <span className="h-levels-n">{n}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </Reveal>

      {/* ── activity ─────────────────────────────────────────────── */}
      <Reveal>
        <section className="h-section">
          <SectionHead num="03" title="Activity" />
          <ContributionHeatmap />
        </section>
      </Reveal>
    </div>
  )
}
