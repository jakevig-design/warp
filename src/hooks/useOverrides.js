import { useCallback } from 'react'
import { supabase } from '../supabase.js'

// All operations update local state first (via patchTrack) and write to
// Supabase in the background — no full library reload per edit.
export function useOverrides(patchTrack) {
  const saveOverride = useCallback(async (videoId, field, value) => {
    if (!videoId || !field) return
    patchTrack(videoId, { [field]: value })
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
      patchTrack(videoId, { [field]: undefined })
      throw error
    }
  }, [patchTrack])

  const toggleStar = useCallback(async (videoId, next) => {
    patchTrack(videoId, { starred: !!next })
    const { error } = await supabase
      .from('tracks')
      .update({ starred: !!next })
      .eq('video_id', videoId)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[warp] toggleStar failed', error)
      patchTrack(videoId, { starred: !next })
      throw error
    }
  }, [patchTrack])

  const bulkSetField = useCallback(async (videoIds, field, value) => {
    if (!videoIds?.length || !field) return
    for (const vid of videoIds) patchTrack(vid, { [field]: value })
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
  }, [patchTrack])

  const bulkSetStarred = useCallback(async (videoIds, starred) => {
    if (!videoIds?.length) return
    for (const vid of videoIds) patchTrack(vid, { starred: !!starred })
    const { error } = await supabase
      .from('tracks')
      .update({ starred: !!starred })
      .in('video_id', videoIds)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[warp] bulkSetStarred failed', error)
      throw error
    }
  }, [patchTrack])

  return { saveOverride, toggleStar, bulkSetField, bulkSetStarred }
}
