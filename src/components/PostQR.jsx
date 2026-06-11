import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// QR code of the current post URL — handy for handing a link to a phone or
// showing during a talk. Rendered in the post's left rail (static, top).
export default function PostQR() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}${window.location.pathname}`)
  }, [])

  return (
    <div className="post-qr">
      <div className="post-qr-tile">
        {url && (
          <QRCodeSVG value={url} size={120} bgColor="#fafafa" fgColor="#0a0a0a" level="M" />
        )}
      </div>
      <span className="post-qr-label">
        scan to open
        <br />
        on your phone
      </span>
    </div>
  )
}
