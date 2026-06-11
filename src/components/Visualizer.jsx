// Animated bar visualizer — purely decorative CSS animation, no audio analysis.
// Each bar uses a slightly different animation duration + delay so the cluster
// looks like it's reacting to music.
const BARS = 14

export default function Visualizer({ playing }) {
  return (
    <div className={`visualizer${playing ? ' playing' : ''}`}>
      {Array.from({ length: BARS }).map((_, i) => (
        <div
          key={i}
          className="vbar"
          style={{
            animationDelay:    `${(i * 73) % 900}ms`,
            animationDuration: `${520 + (i % 5) * 160}ms`,
          }}
        />
      ))}
    </div>
  )
}
