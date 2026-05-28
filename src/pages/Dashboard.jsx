// Dashboard.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PlanCard from '../components/PlanCard'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: plansData }, { data: catsData }] = await Promise.all([
      supabase.from('plans')
        .select('*, plan_images(storage_path), plan_categories(category_id, categories(id, name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
    ])
    setPlans(plansData || [])
    setCategories(catsData || [])
    setLoading(false)
  }

  const handleStatusChange = (planId, newStatus) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newStatus } : p))
  }

  const filtered = plans.filter(p => {
    if (tab === 'active' && p.status !== 'active') return false
    if (tab === 'completed' && p.status === 'active') return false
    if (categoryFilter) {
      const hasCat = (p.plan_categories || []).some(pc => pc.category_id === categoryFilter)
      if (!hasCat) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!(p.asset || '').toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const activeCount = plans.filter(p => p.status === 'active').length
  const completedCount = plans.filter(p => p.status !== 'active').length

  return (
    <div className="page">
      <div className="page-topbar">
        <div className="topbar-left">
          <h1 className="page-title">
            {tab === 'active' ? 'Active plans' : tab === 'completed' ? 'Completed plans' : 'All plans'}
          </h1>
          <span className="plan-count">{filtered.length} plans</span>
        </div>
        <div className="topbar-right">
          <div className="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Search assets & descriptions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={() => navigate('/add')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add new plan
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="tab-group">
          <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            All <span className="tab-count">{plans.length}</span>
          </button>
          <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            Active <span className="tab-count">{activeCount}</span>
          </button>
          <button className={`tab ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
            Completed <span className="tab-count">{completedCount}</span>
          </button>
        </div>

        {categories.length > 0 && (
          <div className="chip-group">
            <button className={`chip ${!categoryFilter ? 'active' : ''}`} onClick={() => setCategoryFilter(null)}>All</button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`chip ${categoryFilter === cat.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading plans...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>{search ? 'No plans match your search.' : 'No plans yet. Add your first plan!'}</p>
          {!search && <button className="btn-add" onClick={() => navigate('/add')}>Add new plan</button>}
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map(plan => (
            <PlanCard key={plan.id} plan={plan} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
