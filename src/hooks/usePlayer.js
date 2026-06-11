import { useState, useEffect, useRef, useCallback } from 'react'

// Mount point for the YouTube iframe API. Lives outside the React tree.
const MOUNT_ID = 'yt-player-mount'

export function usePlayer(tracks, shuffle) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [playing,      setPlaying]      = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [volume,       setVolumeState]  = useState(80)
  const [ready,        setReady]        = useState(false)

  // Refs keep callbacks stale-free without depending on `tracks`/`shuffle`/etc.
  const playerRef       = useRef(null)
  const tracksRef       = useRef(tracks)
  const shuffleRef      = useRef(shuffle)
  const currentTrackRef = useRef(null)
  const playingRef      = useRef(false)

  useEffect(() => { tracksRef.current  = tracks  }, [tracks])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { playingRef.current = playing }, [playing])
  // currentTrackRef is updated synchronously in playByIndex below.

  // ── Advance logic, isolated so onStateChange can call it ───────────────
  const playByIndex = useCallback((idx) => {
    const list = tracksRef.current
    const t = list[idx]
    if (!t) return
    currentTrackRef.current = t
    setCurrentTrack(t)
    const p = playerRef.current
    if (p?.loadVideoById) {
      p.loadVideoById(t.video_id)
      p.playVideo?.()
    }
  }, [])

  const advance = useCallback(() => {
    const list = tracksRef.current
    if (!list.length) return
    const curId  = currentTrackRef.current?.video_id
    const curIdx = list.findIndex(t => t.video_id === curId)
    let nextIdx
    if (shuffleRef.current && list.length > 1) {
      do { nextIdx = Math.floor(Math.random() * list.length) }
      while (nextIdx === curIdx)
    } else {
      nextIdx = curIdx < 0 ? 0 : (curIdx + 1) % list.length
    }
    playByIndex(nextIdx)
  }, [playByIndex])

  // ── YouTube iframe API bootstrap (runs once) ───────────────────────────
  useEffect(() => {
    let cancelled = false

    function init() {
      if (cancelled || playerRef.current) return
      if (!window.YT?.Player) return
      const mount = document.getElementById(MOUNT_ID)
      if (!mount) return

      playerRef.current = new window.YT.Player(MOUNT_ID, {
        height: '90',
        width: '160',
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(volume)
            setReady(true)
          },
          onStateChange: (e) => {
            const s = e.data
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (s === 1) setPlaying(true)
            else if (s === 2) setPlaying(false)
            else if (s === 0) {
              setPlaying(false)
              advance()
            }
          },
        },
      })
    }

    if (window.ytApiReady && window.YT?.Player) init()
    else window.addEventListener('yt-api-ready', init, { once: true })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Progress polling while playing ─────────────────────────────────────
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const p = playerRef.current
      if (!p?.getCurrentTime) return
      const t = p.getCurrentTime() || 0
      const d = p.getDuration()   || 0
      setProgress(d > 0 ? (t / d) * 100 : 0)
    }, 500)
    return () => clearInterval(id)
  }, [playing])

  // ── Public API ────────────────────────────────────────────────────────
  const playTrack = useCallback((track) => {
    const idx = tracksRef.current.findIndex(t => t.video_id === track.video_id)
    if (idx >= 0) playByIndex(idx)
  }, [playByIndex])

  const togglePlay = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (playingRef.current) p.pauseVideo?.()
    else p.playVideo?.()
  }, [])

  const next = useCallback(() => advance(), [advance])

  const prev = useCallback(() => {
    const list = tracksRef.current
    if (!list.length) return
    const curIdx = list.findIndex(t => t.video_id === currentTrackRef.current?.video_id)
    const prevIdx = curIdx <= 0 ? list.length - 1 : curIdx - 1
    playByIndex(prevIdx)
  }, [playByIndex])

  const seek = useCallback((pct) => {
    const p = playerRef.current
    if (!p?.getDuration) return
    const d = p.getDuration() || 0
    if (d <= 0) return
    p.seekTo(d * (pct / 100), true)
  }, [])

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    setVolumeState(clamped)
    playerRef.current?.setVolume?.(clamped)
  }, [])

  return {
    currentTrack, playing, progress, volume, ready,
    playTrack, togglePlay, prev, next, seek, setVolume,
  }
}
