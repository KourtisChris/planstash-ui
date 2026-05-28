// AddPlan.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function AddPlan() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCat, setEditingCat] = useState(null)
  const [catSearch, setCatSearch] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    asset: '', timeframe: '',
    entry_price: '', take_profit: '', stop_loss: '',
    description: '', category_ids: [], is_public: false
  })

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name')
    setCategories(data || [])
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    const { data, error } = await supabase.from('categories').insert({ name: newCatName.trim(), user_id: user.id }).select().single()
    if (!error && data) {
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(f => ({ ...f, category_ids: [...f.category_ids, data.id] }))
      setNewCatName('')
    }
  }

  const handleUpdateCategory = async (id) => {
    if (!editingCat?.name.trim()) return
    const { error } = await supabase.from('categories').update({ name: editingCat.name }).eq('id', id)
    if (!error) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingCat.name } : c))
      setEditingCat(null)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Plans using it will be uncategorized.')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id))
      setForm(f => ({ ...f, category_ids: f.category_ids.filter(cid => cid !== id) }))
    }
  }

  const toggleCategory = (id) => {
    setForm(f => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter(cid => cid !== id)
        : [...f.category_ids, id]
    }))
  }

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.asset.trim()) return setError('Asset is required.')
    setLoading(true)
    setError('')

    const { data: plan, error: planError } = await supabase.from('plans').insert({
      user_id: user.id,
      asset: form.asset.trim(),
      timeframe: form.timeframe || null,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      description: form.description || null,
      is_public: form.is_public,
    }).select().single()

    if (planError) { setError(planError.message); setLoading(false); return }

    if (form.category_ids.length > 0) {
      await supabase.from('plan_categories').insert(
        form.category_ids.map(cid => ({ plan_id: plan.id, category_id: cid }))
      )
    }

    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${plan.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('plan-images').upload(path, file)
      if (!uploadError) {
        await supabase.from('plan_images').insert({ plan_id: plan.id, user_id: user.id, storage_path: path })
      }
    }

    navigate('/')
  }

  const selectedCats = categories.filter(c => form.category_ids.includes(c.id))
  const filteredCats = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))

  return (
    <div className="page page-form">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <h1 className="page-title">Add new plan</h1>
      </div>

      <form onSubmit={handleSubmit} className="plan-form">
        {error && <div className="form-error">{error}</div>}

        <div className="upload-box" onClick={() => document.getElementById('img-upload').click()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
          <span>{images.length > 0 ? `${images.length} file(s) selected` : 'Upload chart screenshots'}</span>
          <small>PNG, JPG — multiple allowed · optional</small>
          <input id="img-upload" type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Asset / pair <span className="req">*</span></label>
            <input type="text" value={form.asset} onChange={e => setForm(f => ({ ...f, asset: e.target.value }))} placeholder="e.g. BTC/USDT" required />
          </div>
          <div className="field">
            <label>Timeframe</label>
            <input type="text" value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} placeholder="e.g. 4H · 1D" />
          </div>
          <div className="field">
            <label>Entry price</label>
            <input type="number" step="any" value={form.entry_price} onChange={e => setForm(f => ({ ...f, entry_price: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="field">
            <label>Take profit</label>
            <input type="number" step="any" value={form.take_profit} onChange={e => setForm(f => ({ ...f, take_profit: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="field">
            <label>Stop loss</label>
            <input type="number" step="any" value={form.stop_loss} onChange={e => setForm(f => ({ ...f, stop_loss: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="field" style={{ position: 'relative' }}>
            <label>Categories</label>
            <div className="cat-select" onClick={() => setShowCatDropdown(!showCatDropdown)}>
              {selectedCats.length > 0
                ? <div className="cat-selected-chips">{selectedCats.map(c => <span key={c.id} className="cat-chip">{c.name}</span>)}</div>
                : <span style={{ color: 'var(--text3)' }}>Select or create categories...</span>
              }
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            {showCatDropdown && (
              <div className="cat-dropdown">
                <div className="cat-search-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input autoFocus type="text" placeholder="Search..." value={catSearch} onChange={e => setCatSearch(e.target.value)} />
                </div>
                <div className="cat-list">
                  {filteredCats.map(cat => (
                    <div key={cat.id} className={`cat-option ${form.category_ids.includes(cat.id) ? 'selected' : ''}`}>
                      {editingCat?.id === cat.id ? (
                        <input
                          autoFocus
                          className="cat-edit-input"
                          value={editingCat.name}
                          onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateCategory(cat.id); if (e.key === 'Escape') setEditingCat(null) }}
                        />
                      ) : (
                        <span onClick={() => toggleCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                          <span
                            className={`cat-checkbox ${form.category_ids.includes(cat.id) ? 'checked' : ''}`}
                            style={{ width: '12px', height: '12px', minWidth: '12px', maxWidth: '12px', display: 'inline-flex', flexShrink: 0 }}
                          >
                            {form.category_ids.includes(cat.id) && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </span>
                          {cat.name}
                        </span>
                      )}
                      <div className="cat-actions">
                        {editingCat?.id === cat.id ? (
                          <button type="button" onClick={() => handleUpdateCategory(cat.id)}>Save</button>
                        ) : (
                          <button type="button" onClick={() => setEditingCat({ id: cat.id, name: cat.name })}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        )}
                        <button type="button" className="cat-delete" onClick={() => handleDeleteCategory(cat.id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cat-new-row">
                  <input type="text" placeholder="New category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} />
                  <button type="button" className="btn-cat-add" onClick={handleAddCategory}>Add</button>
                </div>
              </div>
            )}
          </div>
          <div className="field full">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Setup notes, invalidation level, key observations..." rows={3} />
          </div>
          <div className="field full">
            <div className="toggle-row" onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}>
              <div>
                <div className="toggle-label">Share to Open Plans</div>
                <div className="toggle-desc">This plan will be visible to all users in the Open Plans feed</div>
              </div>
              <div className={`toggle ${form.is_public ? 'on' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Confirm & add plan'}
          </button>
        </div>
      </form>
    </div>
  )
}
