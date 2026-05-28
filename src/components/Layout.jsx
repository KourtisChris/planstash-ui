// Layout.jsx

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [username, setUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
    if (data) {
      setUsername(data.username)
      setNewUsername(data.username)
      if (data.avatar_url) setAvatarUrl(data.avatar_url)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!newUsername.trim()) return
    setSettingsLoading(true)
    setSettingsError('')
    setSettingsSuccess(false)

    if (newUsername.trim() !== username) {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', newUsername.trim()).single()
      if (existing && existing.id !== user.id) {
        setSettingsError('Username is already taken.')
        setSettingsLoading(false)
        return
      }
    }

    let newAvatarUrl = avatarUrl

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(path, avatarFile, { upsert: true })
      if (uploadError) { setSettingsError(uploadError.message); setSettingsLoading(false); return }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      newAvatarUrl = urlData.publicUrl + '?t=' + Date.now()
    }

    const { error } = await supabase.from('profiles').update({
      username: newUsername.trim(),
      avatar_url: newAvatarUrl,
    }).eq('id', user.id)

    if (error) { setSettingsError(error.message) }
    else {
      setUsername(newUsername.trim())
      setAvatarUrl(newAvatarUrl)
      setAvatarFile(null)
      setAvatarPreview(null)
      setSettingsSuccess(true)
    }
    setSettingsLoading(false)
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'PS'
  const displayAvatar = avatarPreview || avatarUrl

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
          <NavLink to="/open-plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Open Plans
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
          <div className="sb-user">
            {displayAvatar
              ? <img src={displayAvatar} alt="avatar" className="sb-avatar-img" />
              : <div className="sb-avatar">{initials}</div>
            }
            <div style={{ overflow: 'hidden' }}>
              {username && <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>@{username}</div>}
              <span className="sb-email">{user?.email}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="mode-btn" onClick={() => { setShowSettings(true); setSettingsError(''); setSettingsSuccess(false) }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings
            </button>
            <button className="signout-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div
                  className="avatar-upload-circle"
                  onClick={() => document.getElementById('avatar-input').click()}
                >
                  {avatarPreview || avatarUrl
                    ? <img src={avatarPreview || avatarUrl} alt="avatar" />
                    : <div className="avatar-upload-initials">{initials}</div>
                  }
                  <div className="avatar-upload-overlay">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                  <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Click to change photo</span>
              </div>

              <div className="field">
                <label>Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => { setNewUsername(e.target.value); setSettingsSuccess(false); setSettingsError('') }}
                  placeholder="Your username"
                  minLength={3}
                  maxLength={30}
                />
              </div>

              {settingsError && <div className="auth-error">{settingsError}</div>}
              {settingsSuccess && <div style={{ fontSize: 13, color: 'var(--green-text)' }}>Settings saved!</div>}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleSave} disabled={settingsLoading}>
                {settingsLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
