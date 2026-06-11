import { useState, useMemo } from 'react'
import { supabase } from '../supabase.js'
import { importPlaylist } from '../hooks/useYouTube.js'
import { getValidYouTubeToken } from '../utils/refreshToken.js'
import { useLastFm } from '../hooks/useLastFm.js'

const SS = (key, fallback = '') => sessionStorage.getItem(key) ?? fallback
const setSS = (key, val) => sessionStorage.setItem(key, val)

// Accept either a raw playlist ID or a full YouTube / YT Music URL.
function extractPlaylistId(input) {
  const s = (input || '').trim()
  const m = s.match(/[?&]list=([^&\s]+)/)
  return m ? m[1] : s
}

export default function SyncBar({ tracks, playlists, onReload, onToast, dispatch }) {
  const [lfmKey,         setLfmKey]         = useState(SS('warp_lfm_key'))
  const [playlistId,     setPlaylistId]     = useState('')
  const [playlistName,   setPlaylistName]   = useState('')
  const [busyPlaylistId, setBusyPlaylistId] = useState(null)
  const [busyAdd,        setBusyAdd]        = useState(false)
  const [busyLiked,      setBusyLiked]      = useState(false)
  const { enrichTracks } = useLastFm()

  const untagged = useMemo(
    () => tracks.filter(t => (t.genre || 'Unknown') === 'Unknown').length,
    [tracks]
  )

  const persistLfm = v => { setLfmKey(v); setSS('warp_lfm_key', v) }

  const runImport = async (plId, plName) => {
    try {
      const token = await getValidYouTubeToken()
      const imported = await importPlaylist(
        token, plId, plName, supabase,
        (msg) => onToast(msg)
      )
      onToast(`imported ${imported.length} tracks from "${plName}"`)
      await onReload()
    } catch (e) {
      onToast(e.message || 'Import failed', true)
    }
  }

  const onLikedClick = async () => {
    setBusyLiked(true)
    try { await runImport('LM', 'Liked Music') }
    finally { setBusyLiked(false) }
  }

  const onAddClick = async () => {
    const plId   = extractPlaylistId(playlistId)
    const plName = playlistName.trim() || plId
    if (!plId) { onToast('playlist ID required', true); return }
    setBusyAdd(true)
    try {
      await runImport(plId, plName)
      setPlaylistId(''); setPlaylistName('')
    } finally { setBusyAdd(false) }
  }

  const onResyncClick = async (p) => {
    setBusyPlaylistId(p.playlist_id)
    try { await runImport(p.playlist_id, p.name) }
    finally { setBusyPlaylistId(null) }
  }

  const onEnrichClick = async () => {
    if (!lfmKey) { onToast('Last.fm API key required', true); return }
    dispatch({ type: 'SET_ENRICHING', value: true })
    try {
      const { updated, total } = await enrichTracks(tracks, lfmKey, (pct) => {
        dispatch({ type: 'SET_ENRICH_PROGRESS', pct })
      })
      onToast(`enriched ${updated} / ${total} tracks`)
      await onReload()
    } catch (e) {
      onToast(e.message || 'Enrichment failed', true)
    } finally {
      dispatch({ type: 'ENRICH_DONE' })
    }
  }

  return (
    <div className="sync-bar">
      <div className="sync-block">
        <label>YOUTUBE MUSIC</label>
        <button
          onClick={onLikedClick}
          disabled={busyLiked}
          style={{ alignSelf: 'flex-start' }}
        >
          {busyLiked ? 'importing…' : '▶ IMPORT LIKED MUSIC'}
        </button>

        <label style={{ marginTop: 8 }}>ADD ANOTHER PLAYLIST</label>
        <div className="sync-row">
          <input
            className="sync-input"
            style={{ flex: 1 }}
            value={playlistId}
            placeholder="playlist ID or URL"
            onChange={e => setPlaylistId(e.target.value)}
          />
          <input
            className="sync-input"
            style={{ flex: 1 }}
            value={playlistName}
            placeholder="display name"
            onChange={e => setPlaylistName(e.target.value)}
          />
          <button onClick={onAddClick} disabled={busyAdd}>
            {busyAdd ? '…' : 'ADD'}
          </button>
        </div>

        <label style={{ marginTop: 8 }}>KNOWN PLAYLISTS</label>
        <div className="playlist-list">
          {!playlists.length && <div style={{ color: 'var(--text-dim)' }}>none yet</div>}
          {playlists.map(p => (
            <div className="playlist-row" key={p.playlist_id}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <button
                onClick={() => onResyncClick(p)}
                disabled={busyPlaylistId === p.playlist_id}
              >
                {busyPlaylistId === p.playlist_id ? '…' : '⟳ RE-SYNC'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sync-block">
        <label>LAST.FM API KEY</label>
        <input
          className="sync-input"
          type="password"
          value={lfmKey}
          placeholder="paste Last.fm API key"
          onChange={e => persistLfm(e.target.value)}
        />

        <label style={{ marginTop: 8 }}>ENRICH GENRES</label>
        <div className="sync-row">
          <button onClick={onEnrichClick} disabled={!untagged}>ENRICH</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {untagged} untagged
          </span>
        </div>

        <div style={{ marginTop: 12, color: 'var(--text-dim)', fontSize: 10, lineHeight: 1.6 }}>
          YOUTUBE ACCESS COMES FROM YOUR GOOGLE SIGN-IN.<br/>
          LAST.FM KEY LIVES IN sessionStorage. CLEARED ON TAB CLOSE.
        </div>
      </div>
    </div>
  )
}
