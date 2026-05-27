import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function MostTraded() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('plans').select('asset').eq('user_id', user.id)
      .then(({ data }) => {
        setPlans(data || [])
        setLoading(false)
      })
  }, [])

  const assetCounts = plans.reduce((acc, p) => {
    acc[p.asset] = (acc[p.asset] || 0) + 1
    return acc
  }, {})

  const sorted = Object.entries(assetCounts).sort((a, b) => b[1] - a[1])
  const max = sorted[0]?.[1] || 1

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="page">
      <div className="page-topbar">
        <h1 className="page-title">Most traded assets</h1>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 400 }}>
        <div className="stat-card">
          <div className="stat-label">Unique assets</div>
          <div className="stat-val">{sorted.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total plans</div>
          <div className="stat-val">{plans.length}</div>
        </div>
      </div>

      {sorted.length > 0 ? (
        <div className="section">
          <div className="section-label">Plans per asset — all time</div>
          <div className="asset-bars">
            {sorted.map(([asset, count]) => (
              <div key={asset} className="asset-bar-row">
                <span className="asset-bar-label">{asset}</span>
                <div className="asset-bar-track">
                  <div className="asset-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
                </div>
                <span className="asset-bar-num">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <p>No plans yet. Add your first plan to see asset stats.</p>
        </div>
      )}
    </div>
  )
}
