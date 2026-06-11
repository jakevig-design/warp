import { useMemo, useState, useCallback } from 'react'
import ColHeaders from './ColHeaders.jsx'
import TrackRow from './TrackRow.jsx'
import { GENRE_CATEGORIES } from '../utils/genreCategories.js'

function durationToSec(d) {
  if (!d) return 0
  const parts = d.split(':').map(Number)
  if (parts.some(isNaN)) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

function compareTracks(a, b, key) {
  if (key === 'duration') return durationToSec(a.duration) - durationToSec(b.duration)
  if (key === 'starred')  return (b.starred ? 1 : 0) - (a.starred ? 1 : 0) // starred first when asc
  const av = (a[key] || '').toString().toLowerCase()
  const bv = (b[key] || '').toString().toLowerCase()
  return av.localeCompare(bv)
}

export default function TrackList({
  tracks,
  currentTrack,
  onPlay,
  onStarToggle,
  onSaveOverride,
  onBulkSetField,
  onBulkSetStarred,
}) {
  const [sortBy,  setSortBy]  = useState(null)   // null = natural / parent order
  const [sortDir, setSortDir] = useState('asc')  // 'asc' | 'desc'
  const [selected, setSelected] = useState(() => new Set())

  const allGenres = useMemo(() => {
    const present = new Set()
    for (const t of tracks) present.add(t.genre || 'Unknown')
    const extras = [...present]
      .filter(g => g !== 'Unknown' && !GENRE_CATEGORIES.includes(g))
      .sort((a, b) => a.localeCompare(b))
    return [...GENRE_CATEGORIES, ...extras, 'Unknown']
  }, [tracks])

  const sorted = useMemo(() => {
    if (!sortBy) return tracks
    const dir = sortDir === 'asc' ? 1 : -1
    return [...tracks].sort((a, b) => compareTracks(a, b, sortBy) * dir)
  }, [tracks, sortBy, sortDir])

  // Prune selection to tracks still visible (e.g. after a filter change).
  const visibleIds = useMemo(() => new Set(sorted.map(t => t.video_id)), [sorted])
  const effectiveSelected = useMemo(() => {
    const s = new Set()
    for (const id of selected) if (visibleIds.has(id)) s.add(id)
    return s
  }, [selected, visibleIds])

  const onSort = useCallback((key) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('asc') }
  }, [sortBy])

  const toggleOne = useCallback((id, checked) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else         next.delete(id)
      return next
    })
  }, [])

  const toggleAll = useCallback((checked) => {
    if (checked) setSelected(new Set(visibleIds))
    else         setSelected(new Set())
  }, [visibleIds])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const allSelected  = sorted.length > 0 && effectiveSelected.size === sorted.length
  const someSelected = effectiveSelected.size > 0

  const onPickGenre = async (e) => {
    const g = e.target.value
    if (!g) return
    try { await onBulkSetField?.([...effectiveSelected], 'genre', g) }
    finally { e.target.value = '' }
  }
  const onStarAll   = () => onBulkSetStarred?.([...effectiveSelected], true)
  const onUnstarAll = () => onBulkSetStarred?.([...effectiveSelected], false)

  if (!tracks.length) {
    return (
      <div className="empty" style={{ minHeight: 200 }}>
        <p>no tracks match the current filter</p>
      </div>
    )
  }

  return (
    <div className="tracklist">
      {someSelected && (
        <div className="bulk-bar">
          <span className="bulk-count">{effectiveSelected.size} selected</span>
          <select className="bulk-genre" defaultValue="" onChange={onPickGenre}>
            <option value="">set genre…</option>
            {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={onStarAll}>★ STAR</button>
          <button onClick={onUnstarAll}>✗ UNSTAR</button>
          <button onClick={clearSelection} style={{ marginLeft: 'auto' }}>CLEAR</button>
        </div>
      )}

      <ColHeaders
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSort}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={toggleAll}
      />

      <div className="tracklist-scroll">
        {sorted.map(t => (
          <TrackRow
            key={t.video_id}
            track={t}
            isPlaying={currentTrack?.video_id === t.video_id}
            isSelected={effectiveSelected.has(t.video_id)}
            allGenres={allGenres}
            onPlay={onPlay}
            onStarToggle={onStarToggle}
            onSaveOverride={onSaveOverride}
            onToggleSelect={toggleOne}
          />
        ))}
      </div>
    </div>
  )
}
