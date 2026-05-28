// OpenPlans.jsx

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function OpenPlans() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*, plan_images(storage_path), plan_categories(categories(name)), reactions(id, type, user_id), comments(id)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    if (data) {
      const userIds = [...new Set(data.map(p => p.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)

      const profileMap = {}
      profiles?.forEach(p => { profileMap[p.id] = p })

      setPlans(data.map(p => ({ ...p, profiles: profileMap[p.user_id] || null })))
    }
    setLoading(false)
  }

  const handleReaction = async (planId, type) => {
    const plan = plans.find(p => p.id === planId)
    const existing = plan.reactions.find(r => r.user_id === user.id)

    if (existing) {
      if (existing.type === type) {
        await supabase.from('reactions').delete().eq('id', existing.id)
        setPlans(prev => prev.map(p => p.id === planId
          ? { ...p, reactions: p.reactions.filter(r => r.id !== existing.id) }
          : p
        ))
      } else {
        await supabase.from('reactions').update({ type }).eq('id', existing.id)
        setPlans(prev => prev.map(p => p.id === planId
          ? { ...p, reactions: p.reactions.map(r => r.id === existing.id ? { ...r, type } : r) }
          : p
        ))
      }
    } else {
      const { data } = await supabase.from('reactions').insert({ plan_id: planId, user_id: user.id, type }).select().single()
      if (data) {
        setPlans(prev => prev.map(p => p.id === planId
          ? { ...p, reactions: [...p.reactions, data] }
          : p
        ))
      }
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="page">
      <div className="page-topbar">
        <h1 className="page-title">Open Plans</h1>
        <span className="plan-count">{plans.length} plans</span>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <p>No public plans yet. Be the first to share one!</p>
        </div>
      ) : (
        <div className="feed">
          {plans.map(plan => (
            <FeedCard key={plan.id} plan={plan} currentUserId={user.id} onReaction={handleReaction} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeedCard({ plan, currentUserId, onReaction }) {
  const [imgUrl, setImgUrl] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const firstImage = plan.plan_images?.[0]
  useEffect(() => {
    if (firstImage) {
      supabase.storage.from('plan-images').createSignedUrl(firstImage.storage_path, 3600)
        .then(({ data }) => { if (data) setImgUrl(data.signedUrl) })
    }
  }, [firstImage?.storage_path])

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('plan_id', plan.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setCommentsLoaded(true)
  }

  const handleToggleComments = () => {
    if (!commentsLoaded) fetchComments()
    setShowComments(s => !s)
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    const { data } = await supabase
      .from('comments')
      .insert({ plan_id: plan.id, user_id: currentUserId, content: newComment.trim() })
      .select('*, profiles(username, avatar_url)')
      .single()
    if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
    }
    setSubmitting(false)
  }

  const greenCount = plan.reactions.filter(r => r.type === 'green').length
  const redCount = plan.reactions.filter(r => r.type === 'red').length
  const myReaction = plan.reactions.find(r => r.user_id === currentUserId)
  const categories = (plan.plan_categories || []).map(pc => pc.categories).filter(Boolean)
  const username = plan.profiles?.username || 'unknown'
  const avatarUrl = plan.profiles?.avatar_url || null
  const date = new Date(plan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="feed-card">
      <div className="feed-card-header">
        <div className="feed-user">
          {avatarUrl
            ? <img src={avatarUrl} alt={username} className="feed-avatar-img" />
            : <div className="feed-avatar">{username.slice(0, 2).toUpperCase()}</div>
          }
          <div>
            <div className="feed-username">@{username}</div>
            <div className="feed-date">{date}</div>
          </div>
        </div>
        <div className="feed-asset">
          <span className="feed-asset-name">{plan.asset}</span>
          {plan.timeframe && <span className="card-tag">{plan.timeframe}</span>}
          {categories.map((cat, i) => <span key={i} className="card-tag">{cat.name}</span>)}
        </div>
      </div>

      {imgUrl && (
        <div className="feed-img">
          <img src={imgUrl} alt={plan.asset} />
        </div>
      )}

      {(plan.entry_price || plan.take_profit || plan.stop_loss) && (
        <div className="feed-levels">
          {plan.entry_price && <span className="feed-level">Entry <strong>{plan.entry_price.toLocaleString()}</strong></span>}
          {plan.take_profit && <span className="feed-level tp">TP <strong>{plan.take_profit.toLocaleString()}</strong></span>}
          {plan.stop_loss && <span className="feed-level sl">SL <strong>{plan.stop_loss.toLocaleString()}</strong></span>}
          {plan.entry_price && plan.take_profit && plan.stop_loss && (
            <span className="feed-level">R/R <strong>1:{Math.abs((plan.take_profit - plan.entry_price) / (plan.entry_price - plan.stop_loss)).toFixed(2)}</strong></span>
          )}
        </div>
      )}

      {plan.description && <p className="feed-desc">{plan.description}</p>}

      <div className="feed-actions">
        <button
          className={`feed-reaction green ${myReaction?.type === 'green' ? 'active' : ''}`}
          onClick={() => onReaction(plan.id, 'green')}
          title="Bullish"
        >
          <CandleIcon color="#22c55e" />
          <span>{greenCount}</span>
        </button>
        <button
          className={`feed-reaction red ${myReaction?.type === 'red' ? 'active' : ''}`}
          onClick={() => onReaction(plan.id, 'red')}
          title="Bearish"
        >
          <CandleIcon color="#ef4444" />
          <span>{redCount}</span>
        </button>
        <button className="feed-comment-btn" onClick={handleToggleComments}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>{plan.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="feed-comments">
          {comments.map(c => (
            <div key={c.id} className="feed-comment">
              {c.profiles?.avatar_url
                ? <img src={c.profiles.avatar_url} alt="" className="feed-comment-avatar" />
                : <div className="feed-comment-avatar-initials">{(c.profiles?.username || '?').slice(0, 2).toUpperCase()}</div>
              }
              <span className="feed-comment-user">@{c.profiles?.username || 'unknown'}</span>
              <span className="feed-comment-text">{c.content}</span>
              <span className="feed-comment-date">
                {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
          <form onSubmit={handleSubmitComment} className="feed-comment-form">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function CandleIcon({ color }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
      <line x1="7" y1="0" x2="7" y2="4" stroke={color} strokeWidth="1.5"/>
      <rect x="2" y="4" width="10" height="10" rx="1" fill={color}/>
      <line x1="7" y1="14" x2="7" y2="18" stroke={color} strokeWidth="1.5"/>
    </svg>
  )
}
