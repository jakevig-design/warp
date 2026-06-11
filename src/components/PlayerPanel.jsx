import { useEffect, useRef } from 'react'
import { formatSeconds } from '../utils/parseDuration.js'
import Visualizer from './Visualizer.jsx'

// The YouTube iframe lives in #yt-player-mount in index.html (outside the
// React tree). On mount we move that node into our visible container so
// the iframe API can still own it while the user sees it inside the panel.
// We never display:none the iframe — YouTube ToS requires it to remain
// visible.
export default function PlayerPanel({ track, playing, progress }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const node = document.getElementById('yt-player-mount')
    if (node && containerRef.current && node.parentElement !== containerRef.current) {
      containerRef.current.appendChild(node)
    }
  })

  return (
    <div className="player-panel">
      <div className="player-iframe-wrap" ref={containerRef}>
        {!track && <Visualizer playing />}
      </div>
      <div className="player-info">
        <div className="player-title">
          {track ? (
            <span className={`ticker${playing ? ' scrolling' : ''}`}>
              {track.title} — {track.artist}
            </span>
          ) : (
            <span style={{ color: 'var(--text-dim)' }}>NOTHING PLAYING</span>
          )}
        </div>
        {track && track.album && (
          <div className="player-album">{track.album}</div>
        )}
        {track && (
          <div style={{ marginTop: 4 }}>
            <span className={`genre-tag${(track.genre || 'Unknown') === 'Unknown' ? ' unknown' : ''}`}>
              {track.genre || 'Unknown'}
            </span>
          </div>
        )}
        <div className="player-readout">
          <span className="player-time">
            {track ? formatLcdTime(progress, track.duration) : '00:00 / 00:00'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Convert progress (0-100%) + duration string ("M:SS") into "MM:SS / MM:SS".
function formatLcdTime(progressPct, durationStr) {
  const totalSec = parseDurationStr(durationStr)
  const elapsedSec = totalSec > 0 ? (progressPct / 100) * totalSec : 0
  return `${pad(formatSeconds(elapsedSec))} / ${pad(formatSeconds(totalSec))}`
}

function parseDurationStr(d) {
  if (!d) return 0
  const parts = d.split(':').map(Number)
  if (parts.some(isNaN)) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

// Force MM:SS even for sub-10-minute tracks (LCD-style fixed width).
function pad(timeStr) {
  if (!timeStr) return '00:00'
  const parts = timeStr.split(':')
  if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1]}`
  return timeStr
}
