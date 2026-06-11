import { useState, useEffect, useRef } from 'react'

// One row in the track list. Owns inline-edit state for artist, album, and genre.
// Optimistically displays edits before the Supabase write completes.
export default function TrackRow({
  track,
  isPlaying,
  isSelected,
  allGenres,
  onPlay,
  onStarToggle,
  onSaveOverride,   // async (videoId, field, value)
  onToggleSelect,
}) {
  const [editing, setEditing] = useState(null) // 'artist' | 'album' | 'genre' | null
  const [draftArtist, setDraftArtist] = useState('')
  const [draftAlbum,  setDraftAlbum]  = useState('')
  const [draftGenre,  setDraftGenre]  = useState('')
  const [pendingArtist, setPendingArtist] = useState(null)
  const [pendingAlbum,  setPendingAlbum]  = useState(null)
  const [pendingGenre,  setPendingGenre]  = useState(null)

  // Clear pending overlay whenever the prop value catches up to the new one.
  useEffect(() => { setPendingArtist(null) }, [track.video_id, track.artist])
  useEffect(() => { setPendingAlbum(null) },  [track.video_id, track.album])
  useEffect(() => { setPendingGenre(null) },  [track.video_id, track.genre])

  const displayArtist = pendingArtist ?? track.artist
  const displayAlbum  = pendingAlbum  ?? (track.album || '')
  const displayGenre  = pendingGenre  ?? track.genre

  const artistOverridden = !!track.overrides?.artist || pendingArtist != null
  const albumOverridden  = !!track.overrides?.album  || pendingAlbum  != null
  const genreOverridden  = !!track.overrides?.genre  || pendingGenre  != null

  const inputRef = useRef(null)
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.select) inputRef.current.select()
    }
  }, [editing])

  const startEdit = (field) => {
    if (field === 'artist')     { setDraftArtist(displayArtist); setEditing('artist') }
    else if (field === 'album') { setDraftAlbum(displayAlbum);   setEditing('album')  }
    else                        { setDraftGenre(displayGenre);   setEditing('genre')  }
  }

  const commit = async () => {
    if (editing === 'artist') {
      const val = draftArtist.trim()
      if (val && val !== track.artist) {
        setPendingArtist(val)
        try { await onSaveOverride(track.video_id, 'artist', val) }
        catch { setPendingArtist(null) }
      }
    } else if (editing === 'album') {
      const val = draftAlbum.trim()
      if (val !== (track.album || '')) {
        setPendingAlbum(val)
        try { await onSaveOverride(track.video_id, 'album', val || null) }
        catch { setPendingAlbum(null) }
      }
    } else if (editing === 'genre') {
      const val = draftGenre.trim()
      if (val && val !== track.genre) {
        setPendingGenre(val)
        try { await onSaveOverride(track.video_id, 'genre', val) }
        catch { setPendingGenre(null) }
      }
    }
    setEditing(null)
  }

  const cancel = () => setEditing(null)

  const onKeyDown = (e) => {
    if (e.key === 'Enter')        { e.preventDefault(); commit() }
    else if (e.key === 'Escape')  { e.preventDefault(); cancel() }
  }

  return (
    <div className={`track-row${isPlaying ? ' playing' : ''}${isSelected ? ' selected' : ''}`}>
      <input
        type="checkbox"
        className="row-checkbox"
        checked={!!isSelected}
        onChange={e => onToggleSelect?.(track.video_id, e.target.checked)}
        onClick={e => e.stopPropagation()}
        aria-label="select row"
      />
      <button
        className={`star-btn${track.starred ? ' starred' : ''}`}
        onClick={() => onStarToggle(track)}
        aria-label="star"
      >
        ★
      </button>

      <div className="col-title" onClick={() => onPlay(track)}>
        {track.title}
      </div>

      <div className="col-artist" onClick={() => editing !== 'artist' && startEdit('artist')}>
        {editing === 'artist' ? (
          <input
            ref={inputRef}
            className="edit-input"
            value={draftArtist}
            onChange={e => setDraftArtist(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
          />
        ) : (
          <>
            <span>{displayArtist}</span>
            {artistOverridden && <span className="override-dot" title="overridden">·</span>}
          </>
        )}
      </div>

      <div className="col-album" onClick={() => editing !== 'album' && startEdit('album')}>
        {editing === 'album' ? (
          <input
            ref={inputRef}
            className="edit-input"
            value={draftAlbum}
            onChange={e => setDraftAlbum(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            placeholder="album…"
          />
        ) : (
          <>
            <span style={{ color: displayAlbum ? undefined : 'var(--text-dim)' }}>
              {displayAlbum || '—'}
            </span>
            {albumOverridden && <span className="override-dot" title="overridden">·</span>}
          </>
        )}
      </div>

      <div className="col-genre" onClick={() => editing !== 'genre' && startEdit('genre')}>
        {editing === 'genre' ? (
          <select
            ref={inputRef}
            className="edit-select"
            value={draftGenre}
            onChange={e => setDraftGenre(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
          >
            {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
            {!allGenres.includes(draftGenre) && draftGenre && (
              <option value={draftGenre}>{draftGenre}</option>
            )}
          </select>
        ) : (
          <>
            <span className={`genre-tag${(displayGenre || 'Unknown') === 'Unknown' ? ' unknown' : ''}`}>
              {displayGenre || 'Unknown'}
            </span>
            {genreOverridden && <span className="override-dot" title="overridden">·</span>}
          </>
        )}
      </div>

      <div className="col-time">{track.duration || ''}</div>
    </div>
  )
}
