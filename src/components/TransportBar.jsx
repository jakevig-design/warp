import { useRef } from 'react'

export default function TransportBar({
  playing, progress, shuffle, volume = 80,
  onTogglePlay, onPrev, onNext, onSeek, onSetVolume, onToggleShuffle,
}) {
  const progressRef = useRef(null)

  const handleSeekClick = (e) => {
    const el = progressRef.current
    if (!el || !onSeek) return
    const rect = el.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    onSeek(Math.max(0, Math.min(100, pct)))
  }

  return (
    <div className="transport">
      <button className="transport-btn" onClick={onPrev} aria-label="previous">⏮</button>
      <button className="transport-btn" onClick={onTogglePlay} aria-label={playing ? 'pause' : 'play'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <button className="transport-btn" onClick={onNext} aria-label="next">⏭</button>

      <div className="progress-track" ref={progressRef} onClick={handleSeekClick}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <button
        className={`transport-btn${shuffle ? ' active' : ''}`}
        onClick={onToggleShuffle}
        aria-label="shuffle"
        title="shuffle"
      >
        🔀
      </button>

      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>🔊</span>
      <input
        className="volume"
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={e => onSetVolume?.(parseInt(e.target.value, 10))}
      />
    </div>
  )
}
