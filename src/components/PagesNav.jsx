// Links out to the standalone pages served from /public (plain <a>, not SPA
// routes — each one is its own static HTML document).
const PAGES = [
  { href: '/torah-chain', label: 'CHAIN OF TORAH' },
  { href: '/curriculum',  label: 'CURRICULUM' },
  { href: '/trip',        label: 'ISRAEL TRIP' },
]

export default function PagesNav({ floating = false }) {
  return (
    <div className={`pages-nav${floating ? ' floating' : ''}`}>
      <span className="pages-nav-label">pages</span>
      {PAGES.map(p => (
        <a key={p.href} href={p.href}>{p.label}</a>
      ))}
    </div>
  )
}
