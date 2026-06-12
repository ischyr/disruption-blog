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
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom'
import { posts } from '../lib/posts'

const W = 900
const H = 620

export default function Graph() {
  const navigate = useNavigate()
  const [hover, setHover] = useState(null)
  const [, setTick] = useState(0)
  const [transform, setTransform] = useState('')
  const svgRef = useRef(null)
  const zoomRef = useRef(null)

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

  // sidebar indexes
  const tagList = useMemo(() => {
    const counts = new Map()
    posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)))
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count, id: `tag:${name}` }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [])

  const postList = useMemo(
    () => posts.map((p) => ({ slug: p.slug, title: p.title, id: p.slug })),
    []
  )

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

  // wheel / pinch / drag zoom + pan, applied as a transform on the graph group
  useEffect(() => {
    const sel = select(svgRef.current)
    const z = d3zoom()
      .scaleExtent([0.4, 6])
      .on('zoom', (e) => setTransform(e.transform.toString()))
    sel.call(z)
    zoomRef.current = z
    return () => sel.on('.zoom', null)
  }, [])

  const zoomBy = (factor) => {
    if (zoomRef.current) zoomRef.current.scaleBy(select(svgRef.current), factor)
  }
  const resetZoom = () => {
    if (zoomRef.current)
      zoomRef.current.transform(select(svgRef.current), zoomIdentity)
  }

  const dimNode = (id) =>
    hover && id !== hover && !neighbors.get(hover)?.has(id)

  return (
    <div className="page">
      <h1 className="page-title">Graph</h1>
      <p className="page-subtitle">
        Every post and the tags that connect them. Hover to focus, click a node
        to explore.
      </p>

      <div className="graph-stage">
      <div className="graph-legend">
        <span className="graph-legend-item">
          <span className="graph-dot graph-dot-post" /> post
        </span>
        <span className="graph-legend-item">
          <span className="graph-dot graph-dot-tag" /> tag
        </span>
      </div>

      <div className="graph-layout">
        <aside className="graph-panel">
          <div className="toc-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 7h.01M7 3h5a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 4 8.6V4a1 1 0 0 1 1-1Z" />
            </svg>
            <span>Tags</span>
            <span className="toc-count">{tagList.length}</span>
          </div>
          <div className="graph-list">
            {tagList.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`graph-item${hover === t.id ? ' active' : ''}`}
                onMouseEnter={() => setHover(t.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => navigate(`/blog?tag=${encodeURIComponent(t.name)}`)}
              >
                <span className="graph-item-label">{t.name}</span>
                <span className="graph-count">{t.count}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="graph-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="graph-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={transform}>
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
                  className={`graph-node graph-node-${n.type}${
                    n.id === hover ? ' focused' : ''
                  }${dimNode(n.id) ? ' dim' : ''}`}
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
            </g>
          </svg>

          <div className="graph-zoom">
            <button type="button" onClick={() => zoomBy(1.3)} aria-label="Zoom in" title="Zoom in">
              +
            </button>
            <button type="button" onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out" title="Zoom out">
              −
            </button>
            <button type="button" onClick={resetZoom} aria-label="Reset view" title="Reset view">
              ⤢
            </button>
          </div>

          <span className="graph-hint">scroll to zoom · drag to pan</span>
        </div>

        <aside className="graph-panel">
          <div className="toc-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5" />
            </svg>
            <span>Posts</span>
            <span className="toc-count">{postList.length}</span>
          </div>
          <div className="graph-list">
            {postList.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`graph-item${hover === p.id ? ' active' : ''}`}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => navigate(`/blog/${p.slug}`)}
              >
                <span className="graph-item-label">{p.title}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
      </div>
    </div>
  )
}
