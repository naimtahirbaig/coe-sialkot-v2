'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAndRedirect() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          router.push(`/portal/${profile.role}`)
          return
        }
      }
      
      router.push('/login')
    }
    
    checkAndRedirect()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1c',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", color: '#94a3b8',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid #2a3654',
          borderTop: '3px solid #c9a33e', borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
