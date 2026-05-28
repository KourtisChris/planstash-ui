// PlanCard.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ConfirmModal from './ConfirmModal'

export default function PlanCard({ plan, onStatusChange }) {
  const navigate = useNavigate()
  const [confirmModal, setConfirmModal] = useState(null)
  const firstImage = plan.plan_images?.[0]
  const [imgUrl, setImgUrl] = useState(null)

  if (firstImage && !imgUrl) {
    supabase.storage.from('plan-images').createSignedUrl(firstImage.storage_path, 3600)
      .then(({ data }) => { if (data) setImgUrl(data.signedUrl) })
  }

  const handleStatusClick = (e, status) => {
    e.stopPropagation()
    setConfirmModal({ status })
  }

  const handleConfirmStatus = async () => {
    const { status } = confirmModal
    const { error } = await supabase.from('plans').update({ status }).eq('id', plan.id)
    if (!error) onStatusChange(plan.id, status)
    setConfirmModal(null)
  }

  const planCategories = (plan.plan_categories || []).map(pc => pc.categories).filter(Boolean)

  return (
    <>
      <div className="plan-card" onClick={() => navigate(`/plan/${plan.id}`)}>
        <div className="card-img">
          {imgUrl
            ? <img src={imgUrl} alt={plan.asset} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div className="card-img-empty">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>No chart</span>
              </div>
          }
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="card-pair">
            {plan.asset}
            {planCategories.map(cat => (
              <span key={cat.id} className="card-tag">{cat.name}</span>
            ))}
          </div>
          {plan.description && <div className="card-desc">{plan.description}</div>}
          {plan.status === 'active' && (
            <div className="card-footer">
              <button className="btn-won" onClick={e => handleStatusClick(e, 'won')}>✓ Won</button>
              <button className="btn-lost" onClick={e => handleStatusClick(e, 'lost')}>✗ Lost</button>
            </div>
          )}
          {plan.status === 'won' && <div className="status-badge won">✓ Won</div>}
          {plan.status === 'lost' && <div className="status-badge lost">✗ Lost</div>}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.status === 'won' ? 'Mark as Won?' : 'Mark as Lost?'}
        message={`Are you sure you want to mark "${plan.asset}" as ${confirmModal?.status}? This will move it to Completed plans.`}
        confirmText={confirmModal?.status === 'won' ? '✓ Mark as Won' : '✗ Mark as Lost'}
        confirmClass={confirmModal?.status === 'won' ? 'btn-won-confirm' : 'btn-lost-confirm'}
        onConfirm={handleConfirmStatus}
        onCancel={() => setConfirmModal(null)}
      />
    </>
  )
}
