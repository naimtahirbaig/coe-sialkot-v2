'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import PublicShell from '@/components/PublicShell';

const CATEGORIES = [
  { key: 'all',         label: '📂 All' },
  { key: 'notes',       label: '📚 Notes' },
  { key: 'past_papers', label: '📝 Past Papers' },
  { key: 'datesheets',  label: '📅 Datesheets' },
];

const CLASSES = ['All Classes', '9th', '10th', '11th', '12th'];

export default function StudentResourcesPage() {
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('all');
  const [classFilter, setClass]   = useState('All Classes');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    fetchResources();
  }, [category, classFilter]);

  async function fetchResources() {
    setLoading(true);
    let query = supabase
      .from('public_resources')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (category !== 'all')          query = query.eq('category', category);
    if (classFilter !== 'All Classes') query = query.or(`class.eq.${classFilter},class.eq.All`);

    const { data } = await query;
    setResources(data || []);
    setLoading(false);
  }

  const filtered = resources.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function categoryColor(cat) {
    return { notes: '#2563eb', past_papers: '#7c3aed', datesheets: '#059669' }[cat] || '#64748b';
  }

  function categoryLabel(cat) {
    return { notes: 'Notes', past_papers: 'Past Paper', datesheets: 'Datesheet' }[cat] || cat;
  }

  return (
    <PublicShell
      title="Student Resources"
      subtitle="Download notes, past papers, and datesheets — free for all students"
      accent="#2563eb"
    >
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                background: category === c.key ? '#2563eb' : '#f1f5f9',
                color: category === c.key ? '#fff' : '#475569',
                transition: 'all 0.15s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Class filter */}
        <select
          value={classFilter}
          onChange={e => setClass(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 14, color: '#334155', background: '#fff', cursor: 'pointer',
          }}
        >
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by title or subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 14, color: '#334155', flex: 1, minWidth: 200, outline: 'none',
          }}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 16 }}>
          Loading resources...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16 }}>No resources found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(r => (
            <div
              key={r.id}
              style={{
                background: '#fff', borderRadius: 12, padding: 20,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid #f1f5f9',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              {/* Category badge + class */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  background: categoryColor(r.category) + '18',
                  color: categoryColor(r.category),
                  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                }}>
                  {categoryLabel(r.category)}
                </span>
                {r.class && (
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                    Class {r.class}
                  </span>
                )}
              </div>

              {/* Title */}
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', lineHeight: 1.4 }}>
                {r.title}
              </div>

              {/* Subject + description */}
              {r.subject && (
                <div style={{ fontSize: 13, color: '#64748b' }}>📖 {r.subject}</div>
              )}
              {r.description && (
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  {r.description}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {r.file_size ? formatSize(r.file_size) : ''}
                  {r.file_size && r.created_at ? ' · ' : ''}
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </span>
                {r.file_url && (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{
                      background: '#2563eb', color: '#fff',
                      padding: '7px 16px', borderRadius: 8,
                      fontSize: 13, fontWeight: 600,
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    ⬇ Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}
