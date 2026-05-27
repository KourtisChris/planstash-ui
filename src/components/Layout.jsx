import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  // const [darkMode, setDarkMode] = useState(true)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'PS'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <img src="/favicon.png" alt="PlanStash" style={{ width: '88px', height: '88px', objectFit: 'contain' }} />
          </div>
          <span className="sb-logo-name">Plan<span>Stash</span></span>
        </div>

        

        <nav className="sb-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            All plans
          </NavLink>
          <NavLink to="/most-traded" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Most traded
          </NavLink>
          <NavLink to="/performance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Performance
          </NavLink>
        </nav>

        <div className="sb-bottom">
          {/* <button className="mode-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀ Light mode' : '☾ Dark mode'}
          </button> */}
          <div className="sb-user">
          <div className="sb-avatar">{initials}</div>
          <span className="sb-email">{user?.email}</span>
        </div>
          <button className="signout-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
