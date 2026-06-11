import { useMemo } from 'react'
import SearchBar    from './SearchBar.jsx'
import GenreFilters from './GenreFilters.jsx'
import TrackList    from './TrackList.jsx'

export default function LibraryTab({
  tracks, playlists, playlistTracks, state, dispatch, player,
  saveOverride, toggleStar, bulkSetField, bulkSetStarred,
}) {
  const { searchQuery, activeGenre, activePlaylist } = state

  const filtered = useMemo(() => {
    const playlistIds = activePlaylist
      ? new Set(playlistTracks.filter(j => j.playlist_id === activePlaylist).map(j => j.video_id))
      : null
    const q = searchQuery.trim().toLowerCase()
    return tracks.filter(t => {
      if (playlistIds && !playlistIds.has(t.video_id)) return false
      if (activeGenre && (t.genre || 'Unknown') !== activeGenre) return false
      if (q) {
        const hay = `${t.title} ${t.artist} ${t.genre || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tracks, playlistTracks, searchQuery, activeGenre, activePlaylist])

  const activePlaylistName = activePlaylist
    ? playlists.find(p => p.playlist_id === activePlaylist)?.name
    : null

  const clearAll = () => {
    dispatch({ type: 'SET_SEARCH',  query:    '' })
    dispatch({ type: 'SET_GENRE',   genre:    null })
    dispatch({ type: 'SET_PLAYLIST', playlist: null })
  }

  if (!tracks.length) {
    return (
      <div className="empty" style={{ minHeight: 300 }}>
        <p>your library is empty</p>
        <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Open ▼ SYNC to import your YouTube playlists
        </p>
      </div>
    )
  }

  return (
    <>
      <SearchBar
        query={searchQuery}
        onChange={q => dispatch({ type: 'SET_SEARCH', query: q })}
        onClear={clearAll}
      />
      <GenreFilters
        tracks={tracks}
        active={activeGenre}
        onSetGenre={g => dispatch({ type: 'SET_GENRE', genre: g })}
      />
      {activePlaylistName && (
        <div style={{ padding: '6px 12px', fontSize: 10, letterSpacing: 1.5, color: 'var(--accent)', textTransform: 'uppercase', background: 'var(--bg-panel)' }}>
          playlist: {activePlaylistName}
          <button style={{ marginLeft: 10, padding: '2px 8px' }} onClick={() => dispatch({ type: 'SET_PLAYLIST', playlist: null })}>×</button>
        </div>
      )}
      <TrackList
        tracks={filtered}
        currentTrack={player.currentTrack}
        onPlay={player.playTrack}
        onStarToggle={(t) => toggleStar(t.video_id, !t.starred)}
        onSaveOverride={saveOverride}
        onBulkSetField={bulkSetField}
        onBulkSetStarred={bulkSetStarred}
      />
    </>
  )
}
