'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import InnerPage from '@/components/site/InnerPage'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Invalid email or password. Please try again.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      // Fetch user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, is_active')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        setError('Account not properly configured. Contact administrator.')
        setLoading(false)
        return
      }

      if (!profile.is_active) {
        await supabase.auth.signOut()
        setError('Your account has been deactivated. Contact administrator.')
        setLoading(false)
        return
      }

      // Redirect to the appropriate portal
      router.push(`/portal/${profile.role}`)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address first.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <InnerPage section="portal" title="Portal" light="Sign In" short
      lede="Teachers, students, parents and the school office sign in here with their school email.">
      <div className="ip-signin">
        <div className="ip-signin-side">
          <img src="/logo.png" alt="" width="88" height="88" />
          <h2>{showForgot ? 'Forgotten your password?' : 'Welcome back'}</h2>
          <p>{showForgot
            ? 'Enter your school email and we will send you a link to choose a new password.'
            : 'Your portal opens straight after you sign in: lessons, timetables, results and messages.'}</p>
        </div>
        <form className="ip-signin-form" onSubmit={showForgot ? handleForgotPassword : handleLogin}>
          {error && <p className="ip-err" role="alert">{error}</p>}
          {resetSent && <p className="ip-ok" role="status">Password reset link sent to your email. Check your inbox.</p>}
          <label>Email address
            <input className="ip-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@coesialkot.edu.pk" autoComplete="email" />
          </label>
          {!showForgot && (
            <label>Password
              <input className="ip-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
            </label>
          )}
          <button type="submit" className="ip-btn" disabled={loading}>
            {showForgot ? (loading ? 'Sending…' : 'Send reset link') : (loading ? 'Signing in…' : 'Sign in')}
          </button>
          <button type="button" className="ip-linkbtn" onClick={() => { setShowForgot(!showForgot); setError(''); setResetSent(false) }}>
            {showForgot ? 'Back to sign in' : 'Forgotten your password?'}
          </button>
        </form>
      </div>
      <p className="ip-note">Students taking an online test do not need to sign in. Open the test link your teacher shared, or go to <a href="/online-tests-2026.html">Online Tests 2026</a>.</p>
    </InnerPage>
  )
}
