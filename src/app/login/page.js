'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(201,163,62,0.06) 0%, transparent 50%), #0a0f1c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#1a2236',
        border: '1px solid #2a3654',
        borderRadius: 16,
        padding: '40px 36px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'white',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', boxShadow: '0 4px 12px rgba(201,163,62,0.3)',
          }}>
            <img src="/logo.jpeg" alt="COE Sialkot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
            Centre of Excellence Sialkot
          </h1>
          <p style={{ fontSize: 12, color: '#c9a33e', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Boys Campus — Portal Login
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* Reset Password Success */}
        {resetSent && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: '#10b981',
          }}>
            Password reset link sent to your email. Check your inbox.
          </div>
        )}

        {/* Login Form */}
        <div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@coesialkot.edu.pk"
              style={{
                width: '100%', padding: '12px 14px', background: '#111827',
                border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9',
                fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif",
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#2a3654'}
            />
          </div>

          {!showForgot && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                style={{
                  width: '100%', padding: '12px 14px', background: '#111827',
                  border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9',
                  fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#2a3654'}
              />
            </div>
          )}

          {/* Login / Reset Button */}
          {showForgot ? (
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              style={{
                width: '100%', padding: '13px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', border: 'none', borderRadius: 8, fontSize: 15,
                fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
                transition: '0.2s',
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #c9a33e, #a8862f)',
                color: '#0a0f1c', border: 'none', borderRadius: 8, fontSize: 15,
                fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
                transition: '0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          )}

          {/* Forgot Password Toggle */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => { setShowForgot(!showForgot); setError(''); setResetSent(false); }}
              style={{
                background: 'none', border: 'none', color: '#64748b',
                fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: '0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#c9a33e'}
              onMouseLeave={(e) => e.target.style.color = '#64748b'}
            >
              {showForgot ? '← Back to Login' : 'Forgot Password?'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 32, paddingTop: 20, borderTop: '1px solid #2a3654',
          textAlign: 'center', fontSize: 11, color: '#64748b', lineHeight: 1.6,
        }}>
          Punjab Daanish Schools & Centres of Excellence Authority<br />
          Government of Punjab
        </div>
      </div>
    </div>
  )
}
