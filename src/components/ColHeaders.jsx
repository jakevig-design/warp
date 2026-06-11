import { useEffect, useRef } from 'react'

const COLS = [
  { key: 'starred',  label: '★',      sortable: true,  className: '' },
  { key: 'title',    label: 'TITLE',  sortable: true,  className: 'col-title' },
  { key: 'artist',   label: 'ARTIST', sortable: true,  className: 'col-artist' },
  { key: 'album',    label: 'ALBUM',  sortable: true,  className: 'col-album' },
  { key: 'genre',    label: 'GENRE',  sortable: true,  className: 'col-genre' },
  { key: 'duration', label: 'TIME',   sortable: true,  className: 'col-time' },
]

export default function ColHeaders({
  sortBy, sortDir, onSort,
  allSelected, someSelected, onToggleAll,
}) {
  const cbRef = useRef(null)
  useEffect(() => {
    if (cbRef.current) cbRef.current.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  const indicator = (key) => {
    if (sortBy !== key) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  return (
    <div className="col-headers">
      <input
        ref={cbRef}
        type="checkbox"
        className="row-checkbox"
        checked={allSelected}
        onChange={e => onToggleAll(e.target.checked)}
        aria-label="select all"
      />
      {COLS.map(c => (
        <div
          key={c.key}
          className={`${c.className} sortable${sortBy === c.key ? ' sorted' : ''}`}
          onClick={() => c.sortable && onSort(c.key)}
          style={c.key === 'duration' ? { textAlign: 'right' } : undefined}
        >
          {c.label}{indicator(c.key)}
        </div>
      ))}
    </div>
  )
}
