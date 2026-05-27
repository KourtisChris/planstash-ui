import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'

export default function PlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [imgUrls, setImgUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => { fetchPlan() }, [id])

  const fetchPlan = async () => {
    const { data } = await supabase.from('plans')
      .select('*, categories(name), plan_images(*)')
      .eq('id', id).single()
    if (data) {
      setPlan(data)
      const urls = await Promise.all(
        (data.plan_images || []).map(img =>
          supabase.storage.from('plan-images').createSignedUrl(img.storage_path, 3600)
            .then(({ data }) => data?.signedUrl)
        )
      )
      setImgUrls(urls.filter(Boolean))
    }
    setLoading(false)
  }

  const handleStatusConfirm = async () => {
    const { status } = confirmModal
    await supabase.from('plans').update({ status }).eq('id', id)
    setPlan(p => ({ ...p, status }))
    setConfirmModal(null)
  }

  const handleDelete = async () => {
    for (const img of plan.plan_images || []) {
      await supabase.storage.from('plan-images').remove([img.storage_path])
    }
    await supabase.from('plans').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!plan) return <div className="loading">Plan not found.</div>

  return (
    <div className="page page-detail">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div className="detail-header-right">
          <button className="btn-secondary" onClick={() => navigate(`/edit/${id}`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button className="btn-danger" onClick={() => setDeleteModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-title-row">
            <h1 className="detail-title">{plan.title}</h1>
            {plan.status === 'won' && <span className="status-badge won">✓ Won</span>}
            {plan.status === 'lost' && <span className="status-badge lost">✗ Lost</span>}
            {plan.status === 'active' && <span className="status-badge active">Active</span>}
          </div>

          {imgUrls.length > 0 && (
            <div className="img-viewer">
              <img src={imgUrls[activeImg]} alt="Chart" className="img-main" />
              {imgUrls.length > 1 && (
                <div className="img-thumbs-row">
                  {imgUrls.map((url, i) => (
                    <img key={i} src={url} alt="" className={`img-thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">Asset</span>
              <span className="detail-val">{plan.asset}</span>
            </div>
            {plan.categories?.name && (
              <div className="detail-row">
                <span className="detail-label">Category</span>
                <span className="detail-val">{plan.categories.name}</span>
              </div>
            )}
            {plan.timeframe && (
              <div className="detail-row">
                <span className="detail-label">Timeframe</span>
                <span className="detail-val">{plan.timeframe}</span>
              </div>
            )}
            {plan.entry_price && (
              <div className="detail-row">
                <span className="detail-label">Entry</span>
                <span className="detail-val">{plan.entry_price.toLocaleString()}</span>
              </div>
            )}
            {plan.take_profit && (
              <div className="detail-row">
                <span className="detail-label">Take profit</span>
                <span className="detail-val green">{plan.take_profit.toLocaleString()}</span>
              </div>
            )}
            {plan.stop_loss && (
              <div className="detail-row">
                <span className="detail-label">Stop loss</span>
                <span className="detail-val red">{plan.stop_loss.toLocaleString()}</span>
              </div>
            )}
            {plan.entry_price && plan.take_profit && plan.stop_loss && (
              <div className="detail-row">
                <span className="detail-label">R/R</span>
                <span className="detail-val">
                  1 : {Math.abs((plan.take_profit - plan.entry_price) / (plan.entry_price - plan.stop_loss)).toFixed(2)}
                </span>
              </div>
            )}
            {plan.description && (
              <div className="detail-row full">
                <span className="detail-label">Notes</span>
                <span className="detail-val notes">{plan.description}</span>
              </div>
            )}
            <div className="detail-row full">
              <span className="detail-label">Added</span>
              <span className="detail-val">{new Date(plan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {plan.status === 'active' && (
            <div className="detail-status-actions">
              <button className="btn-won-lg" onClick={() => setConfirmModal({ status: 'won' })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Mark as Won
              </button>
              <button className="btn-lost-lg" onClick={() => setConfirmModal({ status: 'lost' })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Mark as Lost
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.status === 'won' ? 'Mark as Won?' : 'Mark as Lost?'}
        message={`Are you sure you want to mark this plan as ${confirmModal?.status}? It will move to Completed plans.`}
        confirmText={confirmModal?.status === 'won' ? '✓ Mark as Won' : '✗ Mark as Lost'}
        confirmClass={confirmModal?.status === 'won' ? 'btn-won-confirm' : 'btn-lost-confirm'}
        onConfirm={handleStatusConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <ConfirmModal
        isOpen={deleteModal}
        title="Delete plan?"
        message={`This will permanently delete "${plan.title}" and all its charts. This cannot be undone.`}
        confirmText="Delete"
        confirmClass="btn-delete-confirm"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  )
}
