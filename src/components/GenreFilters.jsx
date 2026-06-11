import { useMemo } from 'react'

export default function GenreFilters({ tracks, active, onSetGenre }) {
  const genres = useMemo(() => {
    const set = new Set()
    for (const t of tracks) {
      const g = t.genre || 'Unknown'
      // Filter out Unknown per design rules — no pill for unknown.
      if (g === 'Unknown') continue
      set.add(g)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [tracks])

  return (
    <div className="genre-filters">
      <button
        className={`genre-pill${active == null ? ' active' : ''}`}
        onClick={() => onSetGenre(null)}
      >
        ALL
      </button>
      {genres.map(g => (
        <button
          key={g}
          className={`genre-pill${active === g ? ' active' : ''}`}
          onClick={() => onSetGenre(g)}
        >
          {g}
        </button>
      ))}
    </div>
  )
}
