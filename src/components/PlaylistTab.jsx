import { useMemo } from 'react'

export default function PlaylistTab({ playlists, playlistTracks, tracks, dispatch }) {
  const counts = useMemo(() => {
    const m = new Map()
    for (const j of playlistTracks) m.set(j.playlist_id, (m.get(j.playlist_id) || 0) + 1)
    return m
  }, [playlistTracks])

  if (!playlists.length) {
    return (
      <div className="empty" style={{ minHeight: 300 }}>
        <p>no playlists imported yet</p>
        <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Open ▼ SYNC to import your first YouTube playlist
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-panel)' }}>
      {playlists.map(p => (
        <div
          key={p.playlist_id}
          className="side-item"
          style={{ borderBottom: '1px solid var(--border-dim)' }}
          onClick={() => dispatch({ type: 'SET_PLAYLIST', playlist: p.playlist_id })}
        >
          <span>{p.name}</span>
          <span className="side-count">{counts.get(p.playlist_id) || 0} TRACKS</span>
        </div>
      ))}
    </div>
  )
}
