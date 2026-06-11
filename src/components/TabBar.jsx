const TABS = [
  { key: 'library',   label: 'LIBRARY' },
  { key: 'genres',    label: 'GENRES' },
  { key: 'artists',   label: 'ARTISTS' },
  { key: 'playlists', label: 'PLAYLISTS' },
  { key: 'starred',   label: '★' },
]

export default function TabBar({ activeTab, onSetTab }) {
  return (
    <div className="tabbar">
      {TABS.map(t => (
        <button
          key={t.key}
          className={`tab${activeTab === t.key ? ' active' : ''}`}
          onClick={() => onSetTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
