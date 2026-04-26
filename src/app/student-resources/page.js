'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PublicShell from '@/components/PublicShell';

const CATEGORIES = [
  { key: 'all',         label: 'All',         icon: '📂' },
  { key: 'notes',       label: 'Notes',        icon: '📚' },
  { key: 'past_papers', label: 'Past Papers',  icon: '📝' },
  { key: 'datesheets',  label: 'Datesheets',   icon: '📅' },
];

const CLASSES   = ['All Classes', '6th', '7th', '8th', '9th', '10th'];
const SUBJECTS  = [
  'All Subjects',
  'Physics', 'Chemistry', 'Biology', 'Mathematics',
  'English', 'Urdu', 'Pakistan Studies', 'Islamiat',
  'Computer', "Tarjuma Tul Qur'an", 'Fine Arts', 'History', 'Geography',
];

const CAT_COLORS = {
  notes:       { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa', border: 'rgba(37,99,235,0.3)'  },
  past_papers: { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
  datesheets:  { bg: 'rgba(5,150,105,0.15)',  text: '#34d399', border: 'rgba(5,150,105,0.3)'  },
};
const CAT_LABEL = { notes: 'Notes', past_papers: 'Past Paper', datesheets: 'Datesheet' };

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function StudentResourcesPage() {
  const [resources, setResources]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState('all');
  const [classFilter, setClass]     = useState('All Classes');
  const [subjectFilter, setSubject] = useState('All Subjects');
  const [search, setSearch]         = useState('');
  const [viewer, setViewer]         = useState(null);

  useEffect(() => { fetchResources(); }, [category, classFilter, subjectFilter]);

  async function fetchResources() {
    setLoading(true);
    let query = supabase
      .from('public_resources')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (category !== 'all')               query = query.eq('category', category);
    if (classFilter !== 'All Classes')    query = query.or(`class.eq.${classFilter},class.eq.All`);
    if (subjectFilter !== 'All Subjects') query = query.eq('subject', subjectFilter);

    const { data } = await query;
    setResources(data || []);
    setLoading(false);
  }

  const filtered = resources.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicShell
      title="📚 Student Resources"
      subtitle="View online or download notes, past papers, and datesheets — free for all students"
      accent="#60a5fa"
    >

      {/* ── PDF Viewer Modal ── */}
      {viewer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Toolbar */}
          <div style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <span style={{
                color: '#f1f5f9', fontWeight: 700, fontSize: 15,
                maxWidth: '55vw', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {viewer.title}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={viewer.file_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#f59e0b', color: '#0f172a',
                  padding: '7px 16px', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}
              >
                ⬇ Download
              </a>
              <button
                onClick={() => setViewer(null)}
                style={{
                  background: '#334155', color: '#f1f5f9',
                  border: 'none', borderRadius: 8,
                  padding: '7px 16px', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* PDF iframe */}
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(viewer.file_url)}&embedded=true`}
            style={{ flex: 1, border: 'none', background: '#fff' }}
            title={viewer.title}
          />
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        <div style={{
          display: 'flex', gap: 4, flexWrap: 'wrap',
          background: '#1e293b', borderRadius: 10, padding: 4,
          border: '1px solid #334155',
        }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)} style={{
              padding: '7px 14px', borderRadius: 7, border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: category === c.key ? '#f59e0b' : 'transparent',
              color: category === c.key ? '#0f172a' : '#94a3b8',
              whiteSpace: 'nowrap',
            }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <select value={classFilter} onChange={e => setClass(e.target.value)} style={selectStyle}>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={subjectFilter} onChange={e => setSubject(e.target.value)} style={selectStyle}>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>

        <input
          type="text" placeholder="🔍  Search..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 1, minWidth: 180 }}
        />
      </div>

      {!loading && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'} found
        </div>
      )}

      {/* ── Cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', height: 160 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>No resources found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(r => {
            const colors = CAT_COLORS[r.category] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' };
            return (
              <div key={r.id} style={{
                background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
                padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  }}>
                    {CAT_LABEL[r.category] || r.category}
                  </span>
                  {r.class && <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Class {r.class}</span>}
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', lineHeight: 1.4 }}>
                  {r.title}
                </div>

                {r.subject && <div style={{ fontSize: 13, color: '#64748b' }}>📖 {r.subject}</div>}

                {r.description && (
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                    {r.description.length > 100 ? r.description.slice(0, 100) + '...' : r.description}
                  </div>
                )}

                <div style={{ fontSize: 12, color: '#475569', marginTop: 'auto' }}>
                  {formatSize(r.file_size)}{r.file_size && r.created_at ? ' · ' : ''}
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </div>

                {r.file_url && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => setViewer({ title: r.title, file_url: r.file_url })}
                      style={{
                        flex: 1, background: 'rgba(37,99,235,0.2)', color: '#60a5fa',
                        border: '1px solid rgba(37,99,235,0.4)', borderRadius: 8,
                        padding: '9px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      }}
                    >
                      👁 View Online
                    </button>
                    <a
                      href={r.file_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, background: '#f59e0b', color: '#0f172a',
                        borderRadius: 8, padding: '9px', fontSize: 13,
                        fontWeight: 700, textDecoration: 'none', textAlign: 'center',
                      }}
                    >
                      ⬇ Download
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PublicShell>
  );
}

const selectStyle = {
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid #334155', background: '#1e293b',
  color: '#e2e8f0', fontSize: 13, cursor: 'pointer', outline: 'none',
};
