import { useMemo } from 'react'
import TrackList from './TrackList.jsx'

export default function StarredTab({ tracks, player, saveOverride, toggleStar, bulkSetField, bulkSetStarred }) {
  const starred = useMemo(() => tracks.filter(t => t.starred), [tracks])

  if (!starred.length) {
    return (
      <div className="empty" style={{ minHeight: 300 }}>
        <p>no starred tracks yet</p>
        <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          click ★ on any track to add it here
        </p>
      </div>
    )
  }

  return (
    <TrackList
      tracks={starred}
      currentTrack={player.currentTrack}
      onPlay={player.playTrack}
      onStarToggle={(t) => toggleStar(t.video_id, !t.starred)}
      onSaveOverride={saveOverride}
      onBulkSetField={bulkSetField}
      onBulkSetStarred={bulkSetStarred}
    />
  )
}
