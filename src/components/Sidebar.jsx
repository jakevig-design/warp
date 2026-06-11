import { useEffect, useRef } from 'react'

// Generic sidebar used by Genre/Artist/Playlist tabs.
// items: [{ key, label, count }]
// activeKey: which is selected
// onSelect(key) — click handler
// Also exposes a responsive <select> fallback for narrow screens.
export default function Sidebar({ items, activeKey, onSelect }) {
  const listRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    if (activeRef.current && listRef.current) {
      const a = activeRef.current.getBoundingClientRect()
      const l = listRef.current.getBoundingClientRect()
      if (a.top < l.top || a.bottom > l.bottom) {
        activeRef.current.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [activeKey])

  return (
    <>
      <select
        className="responsive-side-select"
        value={activeKey ?? ''}
        onChange={e => onSelect(e.target.value || null)}
      >
        <option value="">All</option>
        {items.map(it => (
          <option key={it.key} value={it.key}>
            {it.label} ({it.count})
          </option>
        ))}
      </select>

      <div className="split-side" ref={listRef}>
        {items.map(it => (
          <div
            key={it.key}
            ref={activeKey === it.key ? activeRef : null}
            className={`side-item${activeKey === it.key ? ' active' : ''}`}
            onClick={() => onSelect(it.key)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {it.label}
            </span>
            <span className="side-count">{it.count}</span>
          </div>
        ))}
      </div>
    </>
  )
}
