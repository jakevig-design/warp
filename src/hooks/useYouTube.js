import { supabase } from '../supabase.js'
import { parseDuration } from '../utils/parseDuration.js'

const API = 'https://www.googleapis.com/youtube/v3'

// Grab the Google OAuth access token from the current Supabase session.
// The scopes were requested at sign-in (must include youtube.readonly).
export async function getYouTubeToken() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.provider_token
  if (!token) {
    throw new Error('No YouTube access token. Please sign out and sign back in to grant YouTube access.')
  }
  return token
}

export async function fetchPlaylist(accessToken, playlistId) {
  let items = []
  let pageToken = ''

  do {
    const url = new URL(`${API}/playlistItems`)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('playlistId', playlistId)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (res.status === 401) {
      throw new Error('YouTube access expired. Please sign out and sign back in.')
    }
    if (res.status === 403) {
      throw new Error('YouTube access denied. Make sure youtube.readonly scope is enabled in Supabase.')
    }

    const data = await res.json()
    if (data.error) throw new Error(data.error.message)

    items = [...items, ...(data.items || [])]
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  // Batch-fetch durations from the videos endpoint (50 per call).
  const videoIds = items
    .map(it => it.snippet?.resourceId?.videoId)
    .filter(Boolean)
  const durationMap = {}

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(',')
    const vurl = new URL(`${API}/videos`)
    vurl.searchParams.set('part', 'contentDetails')
    vurl.searchParams.set('id', batch)

    const vres = await fetch(vurl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const vdata = await vres.json()
    if (vdata.error) throw new Error(vdata.error.message)

    for (const v of vdata.items || []) {
      durationMap[v.id] = parseDuration(v.contentDetails?.duration)
    }
  }

  return items
    .filter(it => {
      const t = it.snippet?.title
      return t && t !== 'Deleted video' && t !== 'Private video'
    })
    .map(it => {
      const rawChannel = it.snippet.videoOwnerChannelTitle || it.snippet.channelTitle || 'Unknown'
      // Strip the auto-generated "Artist - Topic" suffix on YT Music channels.
      const artist = rawChannel.replace(/\s*-\s*Topic\s*$/i, '').trim() || 'Unknown'
      return {
        video_id: it.snippet.resourceId.videoId,
        title:    it.snippet.title,
        artist,
        album:    '',
        genre:    'Unknown',
        duration: durationMap[it.snippet.resourceId.videoId] || '--:--',
        position: it.snippet.position ?? 0,
      }
    })
}

// YouTube Music's Liked Music playlist. The Data API may not actually expose
// `LM` (it's a YT Music-only construct, not documented as a Data API
// playlistID). Fall back to `LL` (YouTube's Liked Videos) if `LM` returns
// nothing — YT Music likes are sometimes mirrored to YT's liked-videos
// playlist on accounts with that sync setting.
export async function fetchLikedMusic(accessToken) {
  let tracks = []
  try {
    tracks = await fetchPlaylist(accessToken, 'LM')
  } catch {
    tracks = []
  }
  if (tracks.length === 0) {
    tracks = await fetchPlaylist(accessToken, 'LL')
  }
  return tracks
}

export async function importPlaylist(accessToken, playlistId, playlistName, supabaseClient, onProgress) {
  onProgress?.(`fetching "${playlistName}" from YouTube…`)

  const ytTracks = playlistId === 'LM'
    ? await fetchLikedMusic(accessToken)
    : await fetchPlaylist(accessToken, playlistId)

  if (!ytTracks.length) {
    throw new Error('No tracks found in playlist')
  }

  onProgress?.(`importing ${ytTracks.length} tracks…`)

  const trackRows = ytTracks.map(t => ({
    video_id: t.video_id,
    title:    t.title,
    artist:   t.artist,
    album:    t.album || null,
    genre:    t.genre,
    duration: t.duration,
  }))
  const { error: te } = await supabaseClient
    .from('tracks')
    .upsert(trackRows, { onConflict: 'video_id', ignoreDuplicates: true })
  if (te) throw new Error(te.message)

  const { error: pe } = await supabaseClient
    .from('playlists')
    .upsert(
      { playlist_id: playlistId, name: playlistName },
      { onConflict: 'playlist_id' }
    )
  if (pe) throw new Error(pe.message)

  const joinRows = ytTracks.map(t => ({
    playlist_id: playlistId,
    video_id:    t.video_id,
    position:    t.position,
  }))
  const { error: je } = await supabaseClient
    .from('playlist_tracks')
    .upsert(joinRows, { onConflict: 'playlist_id,video_id', ignoreDuplicates: true })
  if (je) throw new Error(je.message)

  onProgress?.(`done — ${ytTracks.length} tracks imported`)
  return ytTracks
}
