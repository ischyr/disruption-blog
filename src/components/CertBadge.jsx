import { useState } from 'react'

export default function CertBadge({ cert }) {
  const [broken, setBroken] = useState(false)
  const showImage = cert.img && !broken

  return (
    <div className="cert" title={cert.full || cert.name}>
      <div className="cert-tile">
        {showImage ? (
          <img
            src={cert.img}
            alt={cert.name}
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : (
          <svg
            className="cert-placeholder"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="9" r="6" />
            <path d="M9 14.5 7.5 22l4.5-2.5L16.5 22 15 14.5" />
          </svg>
        )}
      </div>
      <span className="cert-name">{cert.name}</span>
    </div>
  )
}
