'use client'
import { useState } from 'react'
import PortalShell from '@/components/PortalShell'
import { SearchBar } from '@/components/UI'

const SUPABASE_URL = 'https://dtdhfkmjdqxpwktvvjfv.supabase.co'

const TEACHERS = [
  { name: 'Abdul Mueed Butt',   file: 'lesson-plan-abdul-mueed-butt.pdf' },
  { name: 'Ahmed Khokhar',      file: 'lesson-plan-ahmed-khokhar.pdf' },
  { name: 'Ahmed Raza',         file: 'lesson-plan-ahmed-raza.pdf' },
  { name: 'Ali Asghar',         file: 'lesson-plan-ali-asghar.pdf' },
  { name: 'Ali Naqvi',          file: 'lesson-plan-ali-naqvi.pdf' },
  { name: 'Altaf Kasana',       file: 'lesson-plan-altaf-kasana.pdf' },
  { name: 'Aqeel Awan',         file: 'lesson-plan-aqeel-awan.pdf' },
  { name: 'Arshid Gill',        file: 'lesson-plan-arshid-gill.pdf' },
  { name: 'Faisal Nasrullah',   file: 'lesson-plan-faisal-nasrullah.pdf' },
  { name: 'Hadeesa Zahra',      file: 'lesson-plan-hadeesa-zahra.pdf' },
  { name: 'Hafiz Waqas',        file: 'lesson-plan-hafiz-waqas.pdf' },
  { name: 'Hammad Ali',         file: 'lesson-plan-hammad-ali.pdf' },
  { name: 'Hassan Bhalli',      file: 'lesson-plan-hassan-bhalli.pdf' },
  { name: 'Hassnain Askari',    file: 'lesson-plan-hassnain-askari.pdf' },
  { name: 'Ishtiaq Ahmed',      file: 'lesson-plan-ishtiaq-ahmed.pdf' },
  { name: 'Kh. Aleem Zakria',   file: 'lesson-plan-kh-aleem-zakria.pdf' },
  { name: 'M. Ahtesham',        file: 'lesson-plan-m-ahtesham.pdf' },
  { name: 'M. Furqan',          file: 'lesson-plan-m-furqan.pdf' },
  { name: 'M. Saddique',        file: 'lesson-plan-m-saddique.pdf' },
  { name: 'Mohsin Yousaf',      file: 'lesson-plan-mohsin-yousaf.pdf' },
  { name: 'Momin Faraz',        file: 'lesson-plan-momin-faraz.pdf' },
  { name: 'Mudassir Mehmood',   file: 'lesson-plan-mudassir-mehmood.pdf' },
  { name: 'Noman Tayyab',       file: 'lesson-plan-noman-tayyab.pdf' },
  { name: 'Shahid Ali',         file: 'lesson-plan-shahid-ali.pdf' },
  { name: 'Shehzad Nasir',      file: 'lesson-plan-shehzad-nasir.pdf' },
  { name: 'Shoaib Arif',        file: 'lesson-plan-shoaib-arif.pdf' },
  { name: 'Shoaib ul Rehman',   file: 'lesson-plan-shoaib-ul-rehman.pdf' },
  { name: 'Soreem Amer',        file: 'lesson-plan-soreem-amer.pdf' },
  { name: 'Tahseen Suleman',    file: 'lesson-plan-tahseen-suleman.pdf' },
  { name: 'Umair Ali',          file: 'lesson-plan-umair-ali.pdf' },
  { name: 'Umer Farooq Islam',  file: 'lesson-plan-umer-farooq-islam.pdf' },
  { name: 'Zahid Mehmood',      file: 'lesson-plan-zahid-mehmood.pdf' },
  { name: 'Zakria Ijaz',        file: 'lesson-plan-zakria-ijaz.pdf' },
]

function getUrl(file) {
  return `${SUPABASE_URL}/storage/v1/object/public/lesson-plans/${file}`
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// Cycle through colors for avatar backgrounds
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6']
function getColor(index) {
  return COLORS[index % COLORS.length]
}

export default function Page() {
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null)

  const filtered = TEACHERS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalShell role="admin" activeNav="staff">

      {/* PDF Viewer Modal */}
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
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                Lesson Plan — {viewing.name}
              </span>
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
              title={`Lesson Plan - ${viewing.name}`}
            />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Teacher Lesson Plans
        </h2>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Session 2026-27 · {TEACHERS.length} teachers
        </p>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search teacher name..."
      />

      {/* Count */}
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        Showing {filtered.length} of {TEACHERS.length} teachers
      </div>

      {/* Teacher Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 14,
      }}>
        {filtered.map((teacher, index) => {
          const color = getColor(index)
          return (
            <div key={teacher.file} style={{
              background: '#1a2236', border: '1px solid #2a3654',
              borderRadius: 10, padding: 18,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${color}20`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>
                {getInitials(teacher.name)}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {teacher.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Lesson Diary 2026-27</div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setViewing(teacher)}
                  title="View PDF"
                  style={{
                    width: 34, height: 34, borderRadius: 6,
                    background: `${color}15`, border: `1px solid ${color}30`,
                    color: color, fontSize: 15, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >👁</button>
                <a
                  href={getUrl(teacher.file)}
                  download
                  title="Download PDF"
                  style={{
                    width: 34, height: 34, borderRadius: 6,
                    background: 'rgba(201,163,62,0.15)', border: '1px solid rgba(201,163,62,0.3)',
                    color: '#c9a33e', fontSize: 15, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >⬇</a>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
          No teachers found matching "{search}"
        </div>
      )}
    </PortalShell>
  )
}
