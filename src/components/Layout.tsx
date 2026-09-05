import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

const MOBILE_QUERY = '(max-width: 1023px)'

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface Props {
  children: ReactNode
  onSignOut: () => void
}

export function Layout({ children, onSignOut }: Props) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  function toggleNav() {
    if (isMobile) {
      setDrawerOpen((open) => !open)
      return
    }
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('sidebarCollapsed', String(next))
      return next
    })
  }

  const navHidden = isMobile ? !drawerOpen : collapsed

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        onNavigate={() => setDrawerOpen(false)}
        onSignOut={onSignOut}
      />

      {isMobile && drawerOpen && (
        <button type="button" className="scrim" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
      )}

      <div className="content-column">
        <header className="content-header">
          <button
            type="button"
            className="menu-button"
            onClick={toggleNav}
            aria-label={navHidden ? 'Show navigation' : 'Hide navigation'}
            aria-expanded={!navHidden}
          >
            <MenuIcon />
          </button>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
