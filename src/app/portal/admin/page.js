'use client'
import { useAuth } from '@/components/AuthProvider'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PortalShell from '@/components/PortalShell'

export default function AdminDashboard() {
  const { profile, logout } = useAuth()
  const [stats, setStats] = useState({ students: 0, teachers: 0, announcements: 0, events: 0 })
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [studentsRes, teachersRes, announcementsRes, eventsRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('*').gte('start_date', new Date().toISOString().split('T')[0]).order('start_date').limit(5),
      ])

      setStats({
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        announcements: announcementsRes.data?.length || 0,
        events: eventsRes.data?.length || 0,
      })
      setAnnouncements(announcementsRes.data || [])
      setEvents(eventsRes.data || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PortalShell role="admin" activeNav="dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Students', value: stats.students, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
          { label: 'Staff Members', value: stats.teachers, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
          { label: 'Announcements', value: stats.announcements, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          { label: 'Upcoming Events', value: stats.events, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#1a2236', border: '1px solid #2a3654', borderRadius: 10, padding: 20,
          }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Fraunces', serif", color: s.color }}>{loading ? '...' : s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Announcements */}
        <div style={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a3654', fontWeight: 600, fontSize: 15 }}>
            Recent Announcements
          </div>
          <div style={{ padding: '16px 20px' }}>
            {announcements.length === 0 && !loading && (
              <p style={{ color: '#64748b', fontSize: 14 }}>No announcements yet. Create one from the Announcements section.</p>
            )}
            {announcements.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: a.priority === 'high' ? '#ef4444' : a.priority === 'urgent' ? '#ef4444' : a.priority === 'medium' ? '#f59e0b' : '#10b981',
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(a.created_at).toLocaleDateString()} ·{' '}
                    <span style={{
                      padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 600,
                      background: a.audience === 'all' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                      color: a.audience === 'all' ? '#3b82f6' : '#8b5cf6',
                    }}>{a.audience}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div style={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a3654', fontWeight: 600, fontSize: 15 }}>
            Upcoming Events
          </div>
          <div style={{ padding: '16px 20px' }}>
            {events.length === 0 && !loading && (
              <p style={{ color: '#64748b', fontSize: 14 }}>No upcoming events.</p>
            )}
            {events.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 6, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: e.event_type === 'exam' ? 'rgba(239,68,68,0.15)' : e.event_type === 'holiday' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                  color: e.event_type === 'exam' ? '#ef4444' : e.event_type === 'holiday' ? '#10b981' : '#3b82f6',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{new Date(e.start_date).getDate()}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{new Date(e.start_date).toLocaleString('en', { month: 'short' })}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{e.start_time || 'All Day'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
