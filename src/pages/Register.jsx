// Register.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check username availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (existing) {
      setError('Username is already taken.')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password)
    if (error) { setError(error.message); setLoading(false); return }

    // Create profile with username
    if (data?.user) {
      await supabase.from('profiles').insert({ id: data.user.id, username: username.trim() })
    }

    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="sb-logo-icon">
            <img src="/favicon.png" alt="PlanStash" style={{ width: '88px', height: '88px', objectFit: 'contain' }} />
          </div>
          <span className="sb-logo-name">Plan<span>Stash</span></span>
        </div>
        <div className="auth-success">
          <p>Check your email to confirm your account, then <Link to="/login">sign in</Link>.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="sb-logo-icon">
            <img src="/favicon.png" alt="PlanStash" style={{ width: '88px', height: '88px', objectFit: 'contain' }} />
          </div>
          <span className="sb-logo-name">Plan<span>Stash</span></span>
        </div>
        <h2 className="auth-title">Create account</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Username <span className="req">*</span></label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. btctrader" minLength={3} maxLength={30} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
