import { useMemo } from 'react'
import Sidebar   from './Sidebar.jsx'
import TrackList from './TrackList.jsx'

export default function GenreTab({ tracks, state, dispatch, player, saveOverride, toggleStar, bulkSetField, bulkSetStarred }) {
  const items = useMemo(() => {
    const counts = new Map()
    for (const t of tracks) {
      const g = t.genre || 'Unknown'
      counts.set(g, (counts.get(g) || 0) + 1)
    }
    const arr = [...counts.entries()].map(([k, c]) => ({ key: k, label: k, count: c }))
    arr.sort((a, b) => a.label.localeCompare(b.label))
    // Push 'Unknown' to the bottom.
    arr.sort((a, b) => (a.key === 'Unknown' ? 1 : 0) - (b.key === 'Unknown' ? 1 : 0))
    return arr
  }, [tracks])

  const active = state.activeSideGenre
  const filtered = useMemo(
    () => active ? tracks.filter(t => (t.genre || 'Unknown') === active) : tracks,
    [tracks, active]
  )

  return (
    <div className="split">
      <Sidebar
        items={items}
        activeKey={active}
        onSelect={g => dispatch({ type: 'SET_SIDE_GENRE', genre: g })}
      />
      <div className="split-main">
        <TrackList
          tracks={filtered}
          currentTrack={player.currentTrack}
          onPlay={player.playTrack}
          onStarToggle={(t) => toggleStar(t.video_id, !t.starred)}
          onSaveOverride={saveOverride}
          onBulkSetField={bulkSetField}
          onBulkSetStarred={bulkSetStarred}
        />
      </div>
    </div>
  )
}
