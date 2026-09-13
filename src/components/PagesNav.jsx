// Links back out to the rest of the site. These are plain <a> tags, not SPA
// routes — everything outside the player is its own static HTML document.
const PAGES = [
  { href: '/',        label: '← JVTESTSPACE' },
  { href: '/judaica', label: 'JUDAICA' },
  { href: 'https://centcom-inky.vercel.app/trip', label: 'ISRAEL TRIP' },
]

export default function PagesNav({ floating = false }) {
  return (
    <div className={`pages-nav${floating ? ' floating' : ''}`}>
      {PAGES.map(p => (
        <a key={p.href} href={p.href}>{p.label}</a>
      ))}
    </div>
  )
}
