import { useCallback } from 'react'
import { supabase } from '../supabase.js'

export function useOverrides(reload) {
  // field: 'artist' | 'genre'
  const saveOverride = useCallback(async (videoId, field, value) => {
    if (!videoId || !field) return
    const payload = {
      video_id: videoId,
      [field]: value,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('track_overrides')
      .upsert(payload, { onConflict: 'video_id' })
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[warp] saveOverride failed', error)
      throw error
    }
    if (reload) await reload()
  }, [reload])

  // ★ toggle lives on tracks.starred directly (not an override)
  const toggleStar = useCallback(async (videoId, next) => {
    const { error } = await supabase
      .from('tracks')
      .update({ starred: !!next })
      .eq('video_id', videoId)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[warp] toggleStar failed', error)
      throw error
    }
    if (reload) await reload()
  }, [reload])

  // Bulk set a single override field (artist | album | genre) across many tracks.
  const bulkSetField = useCallback(async (videoIds, field, value) => {
    if (!videoIds?.length || !field) return
    const now = new Date().toISOString()
    const rows = videoIds.map(vid => ({
      video_id: vid,
      [field]: value,
      updated_at: now,
    }))
    const { error } = await supabase
      .from('track_overrides')
      .upsert(rows, { onConflict: 'video_id' })
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[warp] bulkSetField failed', error)
      throw error
    }
    if (reload) await reload()
  }, [reload])

  // Bulk star / unstar many tracks at once.
  const bulkSetStarred = useCallback(async (videoIds, starred) => {
    if (!videoIds?.length) return
    const { error } = await supabase
      .from('tracks')
      .update({ starred: !!starred })
      .in('video_id', videoIds)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[warp] bulkSetStarred failed', error)
      throw error
    }
    if (reload) await reload()
  }, [reload])

  return { saveOverride, toggleStar, bulkSetField, bulkSetStarred }
}
