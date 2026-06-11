import { tools } from '../data/tools'

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
    </div>
  )
}
