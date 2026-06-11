import { useCallback } from 'react'
import { supabase } from '../supabase.js'
import { pickGenreFromTags } from '../utils/genreMap.js'

const API = 'https://ws.audioscrobbler.com/2.0/'

async function getArtistTopTags(artist, apiKey) {
  const url = `${API}?method=artist.gettoptags&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&format=json&autocorrect=1`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data?.toptags?.tag || null
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

export function useLastFm() {
  // Enriches Unknown-genre tracks. Persists genre back to Supabase tracks table.
  // onProgress(pct, untaggedRemaining) is called between batches.
  const enrichTracks = useCallback(async (tracks, apiKey, onProgress) => {
    if (!apiKey) throw new Error('Last.fm API key required')
    const unknown = (tracks || []).filter(t => (t.genre || 'Unknown') === 'Unknown')
    if (!unknown.length) {
      onProgress?.(100, 0)
      return { updated: 0, total: 0 }
    }

    let updated = 0
    const total = unknown.length
    const BATCH = 5

    // Group by artist so we don't hit Last.fm once per track for shared artists.
    const byArtist = new Map()
    for (const t of unknown) {
      if (!byArtist.has(t.artist)) byArtist.set(t.artist, [])
      byArtist.get(t.artist).push(t)
    }
    const artists = [...byArtist.keys()]

    for (let i = 0; i < artists.length; i += BATCH) {
      const slice = artists.slice(i, i + BATCH)
      const results = await Promise.all(
        slice.map(a => getArtistTopTags(a, apiKey).catch(() => null))
      )
      for (let j = 0; j < slice.length; j++) {
        const artist = slice[j]
        const tags = results[j]
        const genre = pickGenreFromTags(tags)
        if (!genre) continue
        const groupTracks = byArtist.get(artist)
        const videoIds = groupTracks.map(t => t.video_id)
        const { error } = await supabase
          .from('tracks')
          .update({ genre })
          .in('video_id', videoIds)
        if (!error) updated += groupTracks.length
      }
      const done = Math.min(i + BATCH, artists.length)
      const pct = Math.round((done / artists.length) * 100)
      const remaining = total - updated
      onProgress?.(pct, remaining)
      if (i + BATCH < artists.length) await sleep(120)
    }

    onProgress?.(100, total - updated)
    return { updated, total }
  }, [])

  return { enrichTracks }
}
