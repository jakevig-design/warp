export function mergeTrack(track, override) {
  if (!override) return track
  return {
    ...track,
    artist: override.artist ?? track.artist,
    album:  override.album  ?? track.album,
    genre:  override.genre  ?? track.genre,
    overrides: {
      artist: override.artist != null,
      album:  override.album  != null,
      genre:  override.genre  != null,
    },
  }
}
