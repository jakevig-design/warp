// Last.fm tags are messy. This collapses common variants to canonical names.
// Anything unmapped passes through with title-case formatting.

const MAP = {
  'rock': 'Rock',
  'classic rock': 'Classic Rock',
  'hard rock': 'Hard Rock',
  'indie rock': 'Indie Rock',
  'alternative rock': 'Alternative',
  'alternative': 'Alternative',
  'punk': 'Punk',
  'punk rock': 'Punk',
  'metal': 'Metal',
  'heavy metal': 'Metal',
  'pop': 'Pop',
  'electronic': 'Electronic',
  'electronica': 'Electronic',
  'dance': 'Electronic',
  'house': 'House',
  'techno': 'Techno',
  'ambient': 'Ambient',
  'jazz': 'Jazz',
  'blues': 'Blues',
  'soul': 'Soul',
  'funk': 'Funk',
  'r&b': 'R&B',
  'rnb': 'R&B',
  'hip hop': 'Hip Hop',
  'hip-hop': 'Hip Hop',
  'rap': 'Hip Hop',
  'reggae': 'Reggae',
  'ska': 'Ska',
  'country': 'Country',
  'folk': 'Folk',
  'singer-songwriter': 'Folk',
  'acoustic': 'Folk',
  'classical': 'Classical',
  'soundtrack': 'Soundtrack',
  'psychedelic': 'Psychedelic',
  'psychedelic rock': 'Psychedelic',
  'progressive rock': 'Progressive',
  'progressive': 'Progressive',
  'experimental': 'Experimental',
  'world': 'World',
  'latin': 'Latin',
  'disco': 'Disco',
}

const STOP = new Set([
  'seen live', 'favorites', 'favourites', 'favorite', 'favourite',
  'best', 'awesome', 'cool', 'spotify', 'female vocalists', 'male vocalists',
  '80s', '90s', '70s', '60s', '00s', '10s', '20s',
])

function titleCase(s) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function normalizeGenre(raw) {
  if (!raw) return null
  const lower = raw.toLowerCase().trim()
  if (STOP.has(lower)) return null
  if (MAP[lower]) return MAP[lower]
  return titleCase(lower)
}

export function pickGenreFromTags(tags) {
  // tags: [{ name, count? }] from Last.fm
  if (!Array.isArray(tags) || !tags.length) return null
  for (const t of tags) {
    const norm = normalizeGenre(t.name)
    if (norm) return norm
  }
  return null
}
