import { useMemo } from 'react'
import { posts } from '../lib/posts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKS = 53

function ymd(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function level(c) {
  if (c <= 0) return 0
  if (c === 1) return 1
  if (c === 2) return 2
  if (c === 3) return 3
  return 4
}

export default function ContributionHeatmap() {
  const { weeks, total } = useMemo(() => {
    const counts = new Map()
    posts.forEach((p) => {
      const key = String(p.date).slice(0, 10)
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // span 53 weeks ending this week; the grid starts on a Sunday
    const totalDays = (WEEKS - 1) * 7 + today.getDay() + 1
    const cur = new Date(today)
    cur.setDate(cur.getDate() - (totalDays - 1))

    const days = []
    let total = 0
    for (let i = 0; i < totalDays; i++) {
      const key = ymd(cur)
      const count = counts.get(key) || 0
      total += count
      days.push({ date: new Date(cur), key, count })
      cur.setDate(cur.getDate() + 1)
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return { weeks, total }
  }, [])

  // a month label above the first week whose first day starts a new month
  let lastMonth = -1
  const monthLabels = weeks.map((w) => {
    const m = w[0].date.getMonth()
    if (m !== lastMonth) {
      lastMonth = m
      return MONTHS[m]
    }
    return ''
  })

  const fmt = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

  return (
    <div className="heatmap-card">
      <div className="heatmap-scroll">
        <div className="heatmap-months">
          {monthLabels.map((m, i) => (
            <span key={i} className="heatmap-month">
              {m}
            </span>
          ))}
        </div>
        <div className="heatmap-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-week">
              {week.map((day) => (
                <span
                  key={day.key}
                  className="heatmap-cell"
                  data-level={level(day.count)}
                  title={`${
                    day.count === 0
                      ? 'No posts'
                      : `${day.count} post${day.count === 1 ? '' : 's'}`
                  } · ${fmt(day.date)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <span>
          {total} {total === 1 ? 'post' : 'posts'} in the last year
        </span>
        <span className="heatmap-scale">
          Less
          <span className="heatmap-cell" data-level="0" />
          <span className="heatmap-cell" data-level="1" />
          <span className="heatmap-cell" data-level="2" />
          <span className="heatmap-cell" data-level="3" />
          <span className="heatmap-cell" data-level="4" />
          More
        </span>
      </div>
    </div>
  )
}
