import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'
import { mergeTrack } from '../utils/mergeTrack.js'

export function useLibrary(session) {
  const [tracks, setTracks]                 = useState([])
  const [playlists, setPlaylists]           = useState([])
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const [tRes, oRes, pRes, jRes] = await Promise.all([
        supabase.from('tracks').select('*'),
        supabase.from('track_overrides').select('*'),
        supabase.from('playlists').select('*'),
        supabase.from('playlist_tracks').select('*'),
      ])
      for (const r of [tRes, oRes, pRes, jRes]) {
        if (r.error) throw r.error
      }
      const overrideMap = Object.fromEntries((oRes.data || []).map(o => [o.video_id, o]))
      const merged = (tRes.data || []).map(t => mergeTrack(t, overrideMap[t.video_id]))
      setTracks(merged)
      setPlaylists(pRes.data || [])
      setPlaylistTracks(jRes.data || [])
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  // Local optimistic update: change one track's fields in-place without
  // hitting Supabase or triggering a full reload.
  const patchTrack = useCallback((videoId, changes) => {
    setTracks(prev =>
      prev.map(t => t.video_id === videoId ? { ...t, ...changes } : t)
    )
  }, [])

  return { tracks, playlists, playlistTracks, loading, error, reload: load, patchTrack }
}
