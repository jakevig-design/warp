export default function StatusBar({ total, nowPlaying }) {
  return (
    <div className="status-bar">
      <span>{total} TRACK{total === 1 ? '' : 'S'}</span>
      <span>{nowPlaying ? `▶ ${nowPlaying.title}` : 'idle'}</span>
    </div>
  )
}
