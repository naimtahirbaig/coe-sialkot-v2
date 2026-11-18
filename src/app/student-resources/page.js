'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import InnerPage from '@/components/site/InnerPage';
import Link from 'next/link';

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
    <InnerPage section="students" title="Student" light="Resources"
      lede="Read online or download notes, past papers and date sheets, free for every student."
      toc={[{ id: 'find', label: 'Find material' }, { id: 'list', label: 'Results' }, { id: 'more', label: 'More for students' }]}>

      {viewer && (
        <div className="sr-viewer" role="dialog" aria-modal="true" aria-label={viewer.title}>
          <div className="sr-viewer-bar">
            <b>{viewer.title}</b>
            <span>
              <a className="ip-btn" href={viewer.file_url} download target="_blank" rel="noopener noreferrer">Download</a>
              <button type="button" className="ip-btn line" onClick={() => setViewer(null)}>Close</button>
            </span>
          </div>
          <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(viewer.file_url)}&embedded=true`} title={viewer.title} />
        </div>
      )}

      <section id="find">
        <h2>Find material</h2>
        <div className="ip-seg" role="group" aria-label="Type">
          {CATEGORIES.map(c => <button key={c.key} type="button" aria-pressed={category === c.key} onClick={() => setCategory(c.key)}>{c.label}</button>)}
        </div>
        <div className="sr-filters">
          <label>Class<select className="ip-field" value={classFilter} onChange={e => setClass(e.target.value)}>{CLASSES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Subject<select className="ip-field" value={subjectFilter} onChange={e => setSubject(e.target.value)}>{SUBJECTS.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="sr-q">Search<input className="ip-field" type="search" placeholder="Title or subject" value={search} onChange={e => setSearch(e.target.value)} /></label>
        </div>
      </section>

      <hr className="ip-rule" />

      <section id="list">
        <h2>{loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'resource' : 'resources'}`}</h2>
        {loading ? (
          <div className="ip-cards">{[0, 1, 2].map(i => <div key={i} className="ip-card sr-ghost" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="ip-empty">Nothing matches these filters. Try “All Classes” or clear the search.</p>
        ) : (
          <div className="ip-cards">
            {filtered.map(r => (
              <article key={r.id} className="ip-card sr-card">
                <div className="sr-top">
                  <span className={`ip-tag${r.category === 'past_papers' ? ' red' : r.category === 'datesheets' ? ' gold' : ''}`}>{CAT_LABEL[r.category] || r.category}</span>
                  {r.class && <span className="sr-class">Class {r.class}</span>}
                </div>
                <h3>{r.slug
                  ? <Link href={`/student-resources/${r.class}/${(r.subject || 'general').toLowerCase().replace(/[\s']+/g, '-')}/${r.slug}`}>{r.title}</Link>
                  : r.title}</h3>
                {r.subject && <p className="sr-sub">{r.subject}</p>}
                {r.description && <p className="sr-desc">{r.description.length > 110 ? r.description.slice(0, 110) + '…' : r.description}</p>}
                <p className="sr-meta">{[formatSize(r.file_size), r.created_at && new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(', ')}</p>
                {r.file_url && (
                  <div className="sr-actions">
                    <button type="button" className="ip-btn navy" onClick={() => setViewer({ title: r.title, file_url: r.file_url })}>Read online</button>
                    <a className="ip-btn" href={r.file_url} download target="_blank" rel="noopener noreferrer">Download</a>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <hr className="ip-rule" />

      <section id="more">
        <h2>More for students</h2>
        <div className="ip-btnrow">
          <a className="ip-btn" href="/notes-2026.html">Notes &amp; expected questions</a>
          <a className="ip-btn navy" href="/practice-tests-2026.html">Practice tests</a>
          <a className="ip-btn line" href="/mid-term-2026-27.html">Mid-Term date sheet</a>
        </div>
      </section>
    </InnerPage>
  );
}
