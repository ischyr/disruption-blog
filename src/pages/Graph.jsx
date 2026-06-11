import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force'
import { posts } from '../lib/posts'

const W = 900
const H = 620

export default function Graph() {
  const navigate = useNavigate()
  const [hover, setHover] = useState(null)
  const [, setTick] = useState(0)

  const { nodes, links } = useMemo(() => {
    const map = new Map()
    const links = []
    posts.forEach((p) => {
      map.set(p.slug, {
        id: p.slug,
        type: 'post',
        label: p.title,
        url: `/blog/${p.slug}`,
        r: 9,
      })
      p.tags.forEach((t) => {
        const tid = `tag:${t}`
        if (!map.has(tid)) {
          map.set(tid, {
            id: tid,
            type: 'tag',
            label: t,
            url: `/blog?tag=${encodeURIComponent(t)}`,
            r: 6,
          })
        }
        links.push({ source: p.slug, target: tid })
      })
    })
    return { nodes: [...map.values()], links }
  }, [])

  const neighbors = useMemo(() => {
    const m = new Map()
    const add = (a, b) => {
      if (!m.has(a)) m.set(a, new Set())
      m.get(a).add(b)
    }
    links.forEach((l) => {
      add(l.source, l.target)
      add(l.target, l.source)
    })
    return m
  }, [links])

  useEffect(() => {
    nodes.forEach((n, i) => {
      n.x = W / 2 + Math.cos(i) * 50
      n.y = H / 2 + Math.sin(i) * 50
    })
    const sim = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-200))
      .force(
        'link',
        forceLink(links)
          .id((d) => d.id)
          .distance(64)
          .strength(0.6)
      )
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide().radius((d) => d.r + 10))
      .force('x', forceX(W / 2).strength(0.05))
      .force('y', forceY(H / 2).strength(0.05))
      .on('tick', () => setTick((t) => t + 1))
    return () => sim.stop()
  }, [nodes, links])

  const dimNode = (id) =>
    hover && id !== hover && !neighbors.get(hover)?.has(id)

  return (
    <div className="page">
      <h1 className="page-title">Graph</h1>
      <p className="page-subtitle">
        Every post and the tags that connect them. Hover to focus, click a node
        to explore.
      </p>

      <div className="graph-legend">
        <span className="graph-legend-item">
          <span className="graph-dot graph-dot-post" /> post
        </span>
        <span className="graph-legend-item">
          <span className="graph-dot graph-dot-tag" /> tag
        </span>
      </div>

      <div className="graph-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="graph-svg">
          <g>
            {links.map((l, idx) => {
              const s = l.source
              const t = l.target
              if (typeof s !== 'object' || typeof t !== 'object') return null
              const active = hover && (s.id === hover || t.id === hover)
              const dim = hover && !active
              return (
                <line
                  key={idx}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  className={`graph-link${active ? ' active' : ''}${dim ? ' dim' : ''}`}
                />
              )
            })}
          </g>
          {nodes.map((n) => (
            <g
              key={n.id}
              className={`graph-node graph-node-${n.type}${dimNode(n.id) ? ' dim' : ''}`}
              transform={`translate(${n.x ?? W / 2} ${n.y ?? H / 2})`}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => navigate(n.url)}
            >
              <circle r={n.r} />
              <text x={n.r + 6} y={4}>
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
