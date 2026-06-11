import { useReducer, useEffect, useState, useCallback } from 'react'
import { supabase }      from './supabase.js'
import LoginScreen       from './components/LoginScreen.jsx'
import TitleBar          from './components/TitleBar.jsx'
import PlayerPanel       from './components/PlayerPanel.jsx'
import TransportBar      from './components/TransportBar.jsx'
import SyncBar           from './components/SyncBar.jsx'
import TabBar            from './components/TabBar.jsx'
import LibraryTab        from './components/LibraryTab.jsx'
import GenreTab          from './components/GenreTab.jsx'
import ArtistTab         from './components/ArtistTab.jsx'
import PlaylistTab       from './components/PlaylistTab.jsx'
import StarredTab        from './components/StarredTab.jsx'
import StatusBar         from './components/StatusBar.jsx'
import Toast             from './components/Toast.jsx'
import { useLibrary }    from './hooks/useLibrary.js'
import { usePlayer }     from './hooks/usePlayer.js'
import { useOverrides }  from './hooks/useOverrides.js'

// ── Reducer ──────────────────────────────────────────────────────────────────
const INIT = {
  activeTab:       'library',
  activeGenre:     null,
  activeArtist:    null,
  activeSideGenre: null,
  activePlaylist:  null,
  searchQuery:     '',
  showSyncBar:     false,
  shuffle:         false,
  toast:           null,
  enriching:       false,
  enrichProgress:  0,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':            return { ...state, activeTab: action.tab, searchQuery: '' }
    case 'SET_GENRE':          return { ...state, activeGenre: action.genre }
    case 'SET_ARTIST':         return { ...state, activeArtist: action.artist }
    case 'SET_SIDE_GENRE':     return { ...state, activeSideGenre: action.genre }
    case 'SET_PLAYLIST':       return { ...state, activePlaylist: action.playlist, activeTab: 'library' }
    case 'SET_SEARCH':         return { ...state, searchQuery: action.query }
    case 'TOGGLE_SYNC_BAR':    return { ...state, showSyncBar: !state.showSyncBar }
    case 'TOGGLE_SHUFFLE':     return { ...state, shuffle: !state.shuffle }
    case 'SET_TOAST':          return { ...state, toast: action.toast }
    case 'CLEAR_TOAST':        return { ...state, toast: null }
    case 'SET_ENRICHING':      return { ...state, enriching: action.value, enrichProgress: 0 }
    case 'SET_ENRICH_PROGRESS':return { ...state, enrichProgress: action.pct }
    case 'ENRICH_DONE':        return { ...state, enriching: false, enrichProgress: 100 }
    default:                   return state
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [state, dispatch]     = useReducer(reducer, INIT)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const { tracks, playlists, playlistTracks, loading, reload } = useLibrary(session)
  const { saveOverride, toggleStar, bulkSetField, bulkSetStarred } = useOverrides(reload)
  const player = usePlayer(tracks, state.shuffle)

  const toast = useCallback((message, error = false) => {
    dispatch({ type: 'SET_TOAST', toast: { message, error } })
  }, [])

  if (session === undefined) return null // loading auth
  if (!session) return <LoginScreen />

  const tabContent = {
    library:   <LibraryTab   tracks={tracks} playlists={playlists} playlistTracks={playlistTracks} state={state} dispatch={dispatch} player={player} saveOverride={saveOverride} toggleStar={toggleStar} bulkSetField={bulkSetField} bulkSetStarred={bulkSetStarred} />,
    genres:    <GenreTab     tracks={tracks} state={state} dispatch={dispatch} player={player} saveOverride={saveOverride} toggleStar={toggleStar} bulkSetField={bulkSetField} bulkSetStarred={bulkSetStarred} />,
    artists:   <ArtistTab    tracks={tracks} state={state} dispatch={dispatch} player={player} saveOverride={saveOverride} toggleStar={toggleStar} bulkSetField={bulkSetField} bulkSetStarred={bulkSetStarred} />,
    playlists: <PlaylistTab  playlists={playlists} playlistTracks={playlistTracks} tracks={tracks} dispatch={dispatch} />,
    starred:   <StarredTab   tracks={tracks} state={state} dispatch={dispatch} player={player} saveOverride={saveOverride} toggleStar={toggleStar} bulkSetField={bulkSetField} bulkSetStarred={bulkSetStarred} />,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 12px' }}>
      <div style={{ width: '100%', maxWidth: 820, border: '1px solid #3a3a3a', borderRadius: 3, overflow: 'hidden', background: 'var(--bg-panel)' }}>

        <TitleBar onToggleSync={() => dispatch({ type: 'TOGGLE_SYNC_BAR' })} showSync={state.showSyncBar} />

        {state.showSyncBar && (
          <SyncBar
            tracks={tracks}
            playlists={playlists}
            onReload={reload}
            onToast={toast}
            dispatch={dispatch}
            state={state}
          />
        )}

        {state.enriching && (
          <div className="enrich-bar">
            <span>enriching genres…</span>
            <div className="progress-track" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${state.enrichProgress}%` }} />
            </div>
            <span style={{ color: 'var(--accent)', minWidth: 34, textAlign: 'right' }}>{Math.round(state.enrichProgress)}%</span>
          </div>
        )}

        <PlayerPanel track={player.currentTrack} playing={player.playing} progress={player.progress} />

        <TransportBar
          playing={player.playing}
          progress={player.progress}
          shuffle={state.shuffle}
          volume={player.volume}
          onTogglePlay={player.togglePlay}
          onPrev={player.prev}
          onNext={player.next}
          onSeek={player.seek}
          onSetVolume={player.setVolume}
          onToggleShuffle={() => dispatch({ type: 'TOGGLE_SHUFFLE' })}
        />

        <TabBar activeTab={state.activeTab} onSetTab={tab => dispatch({ type: 'SET_TAB', tab })} />

        <div style={{ minHeight: 360 }}>
          {loading
            ? <div className="empty" style={{ height: 360 }}><p>loading library…</p></div>
            : tabContent[state.activeTab]
          }
        </div>

        <StatusBar
          total={tracks.length}
          nowPlaying={player.currentTrack}
        />

      </div>

      {state.toast && (
        <Toast
          message={state.toast.message}
          error={state.toast.error}
          onDismiss={() => dispatch({ type: 'CLEAR_TOAST' })}
        />
      )}
    </div>
  )
}
