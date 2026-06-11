export default function SearchBar({ query, onChange, onClear }) {
  return (
    <div className="search-bar">
      <span style={{ color: 'var(--text-dim)' }}>🔍</span>
      <input
        className="search-input"
        placeholder="search tracks, artists, genres..."
        value={query}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onClear() }}
      />
      <button onClick={onClear}>CLR</button>
    </div>
  )
}
