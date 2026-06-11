import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { site } from '../config'
import { videos } from '../data/videos'

function VideoCard({ video, onPlay }) {
  const [broken, setBroken] = useState(false)
  return (
    <button type="button" className="video-card" onClick={() => onPlay(video.id)}>
      <div className="video-thumb">
        {!broken ? (
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="video-thumb-fallback" />
        )}
        <span className="video-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>
        {video.description && <p className="video-desc">{video.description}</p>}
      </div>
    </button>
  )
}

export default function Videos() {
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e) => e.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  return (
    <div className="page">
      <div className="videos-head">
        <div>
          <h1 className="page-title">Videos</h1>
          <p className="page-subtitle">
            Walkthroughs, write-ups and training clips from my channel.
          </p>
        </div>
        <a className="btn" href={site.socials.youtube} target="_blank" rel="noreferrer">
          Visit channel →
        </a>
      </div>

      <div className="video-grid">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} onPlay={setActive} />
        ))}
      </div>

      {active &&
        createPortal(
          <div
            className="lightbox"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="lightbox-close"
              aria-label="Close"
              onClick={() => setActive(null)}
            >
              ✕
            </button>
            <div className="video-embed" onClick={(e) => e.stopPropagation()}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${active}?autoplay=1`}
                title="Video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
