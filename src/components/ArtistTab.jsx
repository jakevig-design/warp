import { useMemo } from 'react'
import Sidebar   from './Sidebar.jsx'
import TrackList from './TrackList.jsx'

export default function ArtistTab({ tracks, state, dispatch, player, saveOverride, toggleStar, bulkSetField, bulkSetStarred }) {
  const items = useMemo(() => {
    const counts = new Map()
    for (const t of tracks) {
      const a = t.artist || 'Unknown'
      counts.set(a, (counts.get(a) || 0) + 1)
    }
    return [...counts.entries()]
      .map(([k, c]) => ({ key: k, label: k, count: c }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [tracks])

  const active = state.activeArtist
  const filtered = useMemo(
    () => active ? tracks.filter(t => (t.artist || 'Unknown') === active) : tracks,
    [tracks, active]
  )

  return (
    <div className="split">
      <Sidebar
        items={items}
        activeKey={active}
        onSelect={a => dispatch({ type: 'SET_ARTIST', artist: a })}
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
