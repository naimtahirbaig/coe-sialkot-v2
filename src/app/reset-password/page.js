'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleReset() {
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans'" }}>
      <div style={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 16, padding: 40, width: 400, maxWidth: '90vw' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, marginBottom: 8 }}>Reset Password</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>Enter your new password below.</p>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#10b981' }}>Password updated! Redirecting...</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#111827', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#111827', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={handleReset} style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg, #c9a33e, #a8862f)', color: '#0a0f1c', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Update Password</button>
      </div>
    </div>
  )
}
