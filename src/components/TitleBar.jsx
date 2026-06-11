export default function TitleBar({ onToggleSync, showSync }) {
  return (
    <div className="titlebar">
      <div>
        <span className="titlebar-brand">WARP</span>
        <span className="titlebar-version">v3.0</span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          className={`titlebar-sync${showSync ? ' active' : ''}`}
          onClick={onToggleSync}
        >
          ▼ SYNC
        </button>
        <div className="titlebar-dots">
          <div className="titlebar-dot" />
          <div className="titlebar-dot" />
          <div className="titlebar-dot" />
        </div>
      </div>
    </div>
  )
}
