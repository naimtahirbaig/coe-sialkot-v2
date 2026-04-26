'use client'
import { useState } from 'react'
import PortalShell from '@/components/PortalShell'
import { Panel } from '@/components/UI'

const SUPABASE_URL = 'https://dtdhfkmjdqxpwktvvjfv.supabase.co'

const TIMETABLES = [
  {
    key: 'all-classes',
    label: 'All Classes Timetable',
    desc: 'Complete timetable for all classes — 2 per page',
    file: 'timetable-all-classes.pdf',
    icon: '🏫',
    color: '#3b82f6',
  },
  {
    key: 'all-teachers',
    label: 'All Teachers Timetable',
    desc: 'Complete timetable for all teachers — 2 per page',
    file: 'timetable-all-teachers.pdf',
    icon: '👨‍🏫',
    color: '#8b5cf6',
  },
  {
    key: 'teacher-wise',
    label: 'Teacher-Wise Timetable',
    desc: 'New session 2026-27 — April onwards',
    file: 'timetable-teacher-wise-2026-27.pdf',
    icon: '📋',
    color: '#10b981',
  },
]

function getUrl(file) {
  return `${SUPABASE_URL}/storage/v1/object/public/timetables/${file}`
}

export default function Page() {
  const [viewing, setViewing] = useState(null)

  return (
    <PortalShell role="teacher" activeNav="schedule">
      {/* Viewer Modal */}
      {viewing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setViewing(null)}>
          <div style={{
            width: '90vw', height: '90vh', background: '#1a2236',
            border: '1px solid #2a3654', borderRadius: 16, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #2a3654',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{viewing.label}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={getUrl(viewing.file)}
                  download
                  style={{
                    padding: '8px 16px', background: 'linear-gradient(135deg, #c9a33e, #a8862f)',
                    borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#0a0f1c',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  ⬇ Download
                </a>
                <button onClick={() => setViewing(null)} style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 6, color: '#ef4444', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', padding: '8px 16px',
                }}>✕ Close</button>
              </div>
            </div>
            {/* PDF Viewer */}
            <iframe
              src={getUrl(viewing.file)}
              style={{ flex: 1, width: '100%', border: 'none' }}
              title={viewing.label}
            />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Timetable
        </h2>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          View and download school timetables for session 2026-27
        </p>
      </div>

      {/* Timetable Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {TIMETABLES.map(tt => (
          <div key={tt.key} style={{
            background: '#1a2236', border: '1px solid #2a3654', borderRadius: 12,
            padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {/* Icon + Label */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${tt.color}20`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>
                {tt.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{tt.label}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{tt.desc}</div>
              </div>
            </div>

            {/* Session Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${tt.color}15`, color: tt.color,
              padding: '4px 10px', borderRadius: 50, fontSize: 12, fontWeight: 600,
              alignSelf: 'flex-start',
            }}>
              Session 2026-27
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setViewing(tt)}
                style={{
                  flex: 1, padding: '10px 0', background: `${tt.color}15`,
                  border: `1px solid ${tt.color}40`, borderRadius: 6,
                  color: tt.color, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                👁 View
              </button>
              <a
                href={getUrl(tt.file)}
                download
                style={{
                  flex: 1, padding: '10px 0', background: 'linear-gradient(135deg, #c9a33e, #a8862f)',
                  border: 'none', borderRadius: 6, color: '#0a0f1c',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  textDecoration: 'none', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                ⬇ Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  )
}
