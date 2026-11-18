'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import InnerPage from '@/components/site/InnerPage'

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
    <InnerPage section="portal" title="Choose a New" light="Password" short>
      <div className="ip-signin">
        <div className="ip-signin-side">
          <img src="/logo.png" alt="" width="88" height="88" />
          <h2>New password</h2>
          <p>Use at least 6 characters. You will go back to the sign-in page once it is saved.</p>
        </div>
        <form className="ip-signin-form" onSubmit={(e) => { e.preventDefault(); handleReset() }}>
          {error && <p className="ip-err" role="alert">{error}</p>}
          {success && <p className="ip-ok" role="status">Password updated. Taking you to sign in…</p>}
          <label>New password<input className="ip-field" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></label>
          <label>Confirm password<input className="ip-field" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" /></label>
          <button type="submit" className="ip-btn">Save password</button>
        </form>
      </div>
    </InnerPage>
  )
}
