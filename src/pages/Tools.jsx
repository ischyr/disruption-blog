import { tools } from '../data/tools'
import { showcase } from '../data/showcase'
import Reveal from '../components/Reveal'

export default function Tools() {
  return (
    <div className="page">
      <h1 className="page-title">Tools</h1>
      <p className="page-subtitle">
        Open-source tooling I have built for security testing and automation.
      </p>

      <div className="tool-grid">
        {tools.map((tool) => (
          <a
            key={tool.name}
            className="card tool-card"
            href={tool.link}
            target="_blank"
            rel="noreferrer"
          >
            <div className="card-inner">
              <h3 className="card-title">{tool.name}</h3>
              <p className="card-excerpt">{tool.description}</p>
              <div className="card-foot">
                <span className="tag">{tool.language}</span>
                <span className="read-link">View source →</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {showcase.length > 0 && (
        <section className="showcase">
          <div className="section-header">
            <h2>Featured projects</h2>
            <span className="showcase-count">
              {showcase.length} {showcase.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          <div className="showcase-list">
            {showcase.map((item, i) => {
              const primary = item.website || item.source
              return (
                <Reveal key={item.name}>
                  <article
                    className={`showcase-item${i % 2 === 1 ? ' reverse' : ''}`}
                  >
                    <a
                      className="showcase-media"
                      href={primary}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${item.name}`}
                    >
                      <img
                        src={item.image}
                        alt={`${item.name} screenshot`}
                        loading="lazy"
                      />
                    </a>

                    <div className="showcase-body">
                      {item.eyebrow && (
                        <span className="showcase-eyebrow">
                          <span className="showcase-dot" />
                          {item.eyebrow}
                        </span>
                      )}
                      <h3 className="showcase-title">{item.name}</h3>
                      <p className="showcase-desc">{item.description}</p>

                      {item.stack?.length > 0 && (
                        <div className="showcase-stack">
                          {item.stack.map((s) => (
                            <span key={s} className="tag">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="showcase-actions">
                        {item.website && (
                          <a
                            className="btn btn-primary"
                            href={item.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Visit site →
                          </a>
                        )}
                        {item.source && (
                          <a
                            className="btn"
                            href={item.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View source
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
