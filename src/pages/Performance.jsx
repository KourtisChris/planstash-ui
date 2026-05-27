import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Performance() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: plansData }, { data: catsData }] = await Promise.all([
        supabase.from('plans').select('*, categories(name)').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id)
      ])
      setPlans(plansData || [])
      setCategories(catsData || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const completed = plans.filter(p => p.status !== 'active')
  const won = completed.filter(p => p.status === 'won').length
  const lost = completed.filter(p => p.status === 'lost').length
  const winRate = completed.length > 0 ? Math.round((won / completed.length) * 100) : 0

  const catStats = categories.map(cat => {
    const catPlans = completed.filter(p => p.category_id === cat.id)
    const catWon = catPlans.filter(p => p.status === 'won').length
    const catLost = catPlans.filter(p => p.status === 'lost').length
    const catRate = catPlans.length > 0 ? Math.round((catWon / catPlans.length) * 100) : null
    return { ...cat, total: catPlans.length, won: catWon, lost: catLost, winRate: catRate }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="page">
      <div className="page-topbar">
        <h1 className="page-title">Performance</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Completed plans</div>
          <div className="stat-val">{completed.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Won</div>
          <div className="stat-val green">{won}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lost</div>
          <div className="stat-val red">{lost}</div>
        </div>
      </div>

      {completed.length > 0 && (
        <div className="winrate-card">
          <div className="winrate-label">Overall win rate</div>
          <div className="winrate-bar-track">
            <div className="winrate-bar-fill" style={{ width: `${winRate}%` }} />
          </div>
          <div className="winrate-legend">
            <span>0%</span>
            <span className="winrate-pct">{winRate}%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {catStats.length > 0 && (
        <div className="section">
          <div className="section-label">By strategy category</div>
          <div className="cat-stats-table">
            <div className="cat-stats-header">
              <span>Category</span>
              <span>Total</span>
              <span>Won</span>
              <span>Lost</span>
              <span>Win rate</span>
            </div>
            {catStats.map(cat => (
              <div key={cat.id} className="cat-stats-row">
                <span>{cat.name}</span>
                <span>{cat.total}</span>
                <span className="green">{cat.won}</span>
                <span className="red">{cat.lost}</span>
                <span className={cat.winRate >= 50 ? 'green' : 'red'}>{cat.winRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length === 0 && (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <p>No completed plans yet. Mark plans as Won or Lost to see your performance.</p>
        </div>
      )}
    </div>
  )
}
