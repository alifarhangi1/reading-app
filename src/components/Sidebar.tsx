import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/shelf', label: 'shelf' },
  { to: '/log', label: 'daily log' },
  { to: '/history', label: 'history' },
  { to: '/settings', label: 'settings' },
]

interface Props {
  collapsed: boolean
  drawerOpen: boolean
  onNavigate: () => void
  onSignOut: () => void
}

export function Sidebar({ collapsed, drawerOpen, onNavigate, onSignOut }: Props) {
  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}${drawerOpen ? ' is-open' : ''}`}>
      <div className="sidebar-inner">
        <span className="brand">PAGE DEBT</span>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={onNavigate}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <button type="button" className="button-quiet" onClick={onSignOut}>
          sign out
        </button>
      </div>
    </aside>
  )
}
