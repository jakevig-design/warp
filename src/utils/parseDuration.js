// YouTube ISO 8601 durations: "PT4M13S", "PT1H2M3S", "PT45S"
export function parseDuration(iso) {
  if (!iso) return ''
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return ''
  const h = parseInt(m[1] || 0, 10)
  const mn = parseInt(m[2] || 0, 10)
  const s = parseInt(m[3] || 0, 10)
  const pad = n => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(mn)}:${pad(s)}` : `${mn}:${pad(s)}`
}

export function formatSeconds(sec) {
  if (sec == null || isNaN(sec)) return '0:00'
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = n => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
