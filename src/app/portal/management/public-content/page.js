'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'resources', label: '📚 Student Resources' },
  { key: 'notices',   label: '📋 Notice Board' },
  { key: 'tests',     label: '🧪 Practice Tests' },
];

// ── Shared helpers ────────────────────────────────────────────────────────────
const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</label>
    <input
      {...props}
      style={{
        padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
        fontSize: 14, color: '#1e293b', outline: 'none', width: '100%',
        ...props.style,
      }}
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</label>
    <select
      {...props}
      style={{
        padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
        fontSize: 14, color: '#1e293b', outline: 'none', width: '100%', background: '#fff',
        ...props.style,
      }}
    >
      {children}
    </select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</label>
    <textarea
      {...props}
      style={{
        padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
        fontSize: 14, color: '#1e293b', outline: 'none', width: '100%',
        resize: 'vertical', minHeight: 100,
        ...props.style,
      }}
    />
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function PublicContentManager() {
  
  const [tab, setTab] = useState('resources');

  return (
    <div style={{ padding: '24px 0' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
        Public Content Manager
      </h2>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
        Manage content visible to everyone — no login required to view.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px',
              border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
              color: tab === t.key ? '#2563eb' : '#64748b',
              borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resources' && <ResourcesManager supabase={supabase} />}
      {tab === 'notices'   && <NoticesManager   supabase={supabase} />}
      {tab === 'tests'     && <TestsManager     supabase={supabase} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// RESOURCES MANAGER
// ──────────────────────────────────────────────────────────────────────────────
function ResourcesManager({ supabase }) {
  const fileRef = useRef();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    title: '', description: '', category: 'notes',
    subject: '', class: '', file: null,
  });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from('public_resources')
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setMsg('Title is required.');
    setSaving(true); setMsg('');

    let file_url = null, file_name = null, file_size = null;

    if (form.file) {
      const ext  = form.file.name.split('.').pop();
      const path = `${Date.now()}-${form.title.replace(/\s+/g, '-')}.${ext}`;
      const { data, error } = await supabase.storage
        .from('public-resources')
        .upload(path, form.file, { upsert: true });

      if (error) { setSaving(false); return setMsg('Upload failed: ' + error.message); }

      const { data: { publicUrl } } = supabase.storage
        .from('public-resources')
        .getPublicUrl(data.path);

      file_url  = publicUrl;
      file_name = form.file.name;
      file_size = form.file.size;
    }

    const { error } = await supabase.from('public_resources').insert({
      title: form.title, description: form.description,
      category: form.category, subject: form.subject,
      class: form.class || 'All',
      file_url, file_name, file_size,
    });

    if (error) setMsg('Error: ' + error.message);
    else {
      setMsg('✅ Resource added!');
      setForm({ title: '', description: '', category: 'notes', subject: '', class: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      fetchItems();
    }
    setSaving(false);
  }

  async function toggleVisibility(item) {
    await supabase.from('public_resources')
      .update({ is_visible: !item.is_visible })
      .eq('id', item.id);
    fetchItems();
  }

  async function deleteItem(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    if (item.file_name) {
      // extract path from URL
      const path = item.file_url.split('/public-resources/')[1];
      if (path) await supabase.storage.from('public-resources').remove([path]);
    }
    await supabase.from('public_resources').delete().eq('id', item.id);
    fetchItems();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Upload form */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Upload New Resource</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Physics Chapter 1 Notes" />
          </div>
          <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="notes">📚 Notes</option>
            <option value="past_papers">📝 Past Papers</option>
            <option value="datesheets">📅 Datesheets</option>
          </Select>
          <Input label="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Physics" />
          <Select label="Class" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
            <option value="">All Classes</option>
            <option>9th</option><option>10th</option><option>11th</option><option>12th</option>
          </Select>
          <div style={{ gridColumn: '1/-1' }}>
            <Textarea label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>File (PDF, DOC, etc.)</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              onChange={e => setForm(f => ({ ...f, file: e.target.files[0] || null }))}
              style={{ fontSize: 14 }}
            />
          </div>
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 14, color: msg.startsWith('✅') ? '#059669' : '#dc2626' }}>{msg}</div>}
        <button
          onClick={handleSubmit} disabled={saving}
          style={{
            marginTop: 20, background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Uploading...' : '+ Add Resource'}
        </button>
      </div>

      {/* List */}
      <ItemList
        items={items}
        loading={loading}
        onToggle={toggleVisibility}
        onDelete={deleteItem}
        renderMeta={item => `${item.category.replace('_', ' ')} · ${item.subject || '—'} · Class ${item.class || 'All'}`}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// NOTICES MANAGER
// ──────────────────────────────────────────────────────────────────────────────
function NoticesManager({ supabase }) {
  const fileRef = useRef();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ title: '', body: '', notice_date: new Date().toISOString().split('T')[0], is_pinned: false, file: null });
  const [msg, setMsg]         = useState('');

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from('public_notices').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setMsg('Title is required.');
    setSaving(true); setMsg('');

    let file_url = null, file_name = null;

    if (form.file) {
      const ext  = form.file.name.split('.').pop();
      const path = `${Date.now()}-${form.title.replace(/\s+/g, '-')}.${ext}`;
      const { data, error } = await supabase.storage.from('public-notices').upload(path, form.file, { upsert: true });
      if (error) { setSaving(false); return setMsg('Upload failed: ' + error.message); }
      const { data: { publicUrl } } = supabase.storage.from('public-notices').getPublicUrl(data.path);
      file_url  = publicUrl;
      file_name = form.file.name;
    }

    const { error } = await supabase.from('public_notices').insert({
      title: form.title, body: form.body,
      notice_date: form.notice_date, is_pinned: form.is_pinned,
      file_url, file_name,
    });

    if (error) setMsg('Error: ' + error.message);
    else {
      setMsg('✅ Notice posted!');
      setForm({ title: '', body: '', notice_date: new Date().toISOString().split('T')[0], is_pinned: false, file: null });
      if (fileRef.current) fileRef.current.value = '';
      fetchItems();
    }
    setSaving(false);
  }

  async function toggleVisibility(item) {
    await supabase.from('public_notices').update({ is_visible: !item.is_visible }).eq('id', item.id);
    fetchItems();
  }

  async function deleteItem(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await supabase.from('public_notices').delete().eq('id', item.id);
    fetchItems();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Post New Notice</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notice title" />
          </div>
          <Input label="Notice Date" type="date" value={form.notice_date} onChange={e => setForm(f => ({ ...f, notice_date: e.target.value }))} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
            <input type="checkbox" id="pinned" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
            <label htmlFor="pinned" style={{ fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>📌 Pin this notice</label>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Textarea label="Notice Body (optional)" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Full notice text..." style={{ minHeight: 120 }} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Attachment (optional)</label>
            <input ref={fileRef} type="file" onChange={e => setForm(f => ({ ...f, file: e.target.files[0] || null }))} style={{ fontSize: 14 }} />
          </div>
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 14, color: msg.startsWith('✅') ? '#059669' : '#dc2626' }}>{msg}</div>}
        <button onClick={handleSubmit} disabled={saving} style={{ marginTop: 20, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Posting...' : '+ Post Notice'}
        </button>
      </div>

      <ItemList items={items} loading={loading} onToggle={toggleVisibility} onDelete={deleteItem}
        renderMeta={item => `${item.notice_date} ${item.is_pinned ? '· 📌 Pinned' : ''}`} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TESTS MANAGER
// ──────────────────────────────────────────────────────────────────────────────
function TestsManager({ supabase }) {
  const fileRef = useRef();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'paste'
  const [form, setForm]       = useState({ title: '', description: '', subject: '', class: '', html_content: '', file: null });
  const [msg, setMsg]         = useState('');

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from('public_practice_tests').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setMsg('Title is required.');
    setSaving(true); setMsg('');

    let file_url = null;

    if (uploadMode === 'file' && form.file) {
      const path = `${Date.now()}-${form.title.replace(/\s+/g, '-')}.html`;
      const { data, error } = await supabase.storage.from('practice-tests').upload(path, form.file, { upsert: true, contentType: 'text/html' });
      if (error) { setSaving(false); return setMsg('Upload failed: ' + error.message); }
      const { data: { publicUrl } } = supabase.storage.from('practice-tests').getPublicUrl(data.path);
      file_url = publicUrl;
    }

    const { error } = await supabase.from('public_practice_tests').insert({
      title: form.title, description: form.description,
      subject: form.subject, class: form.class || 'All',
      html_content: uploadMode === 'paste' ? form.html_content : null,
      file_url,
    });

    if (error) setMsg('Error: ' + error.message);
    else {
      setMsg('✅ Practice test added!');
      setForm({ title: '', description: '', subject: '', class: '', html_content: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      fetchItems();
    }
    setSaving(false);
  }

  async function toggleVisibility(item) {
    await supabase.from('public_practice_tests').update({ is_visible: !item.is_visible }).eq('id', item.id);
    fetchItems();
  }

  async function deleteItem(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await supabase.from('public_practice_tests').delete().eq('id', item.id);
    fetchItems();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Add New Practice Test</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Physics Ch.1 MCQs" />
          </div>
          <Input label="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Physics" />
          <Select label="Class" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
            <option value="">All Classes</option>
            <option>9th</option><option>10th</option><option>11th</option><option>12th</option>
          </Select>
          <div style={{ gridColumn: '1/-1' }}>
            <Textarea label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the test..." />
          </div>

          {/* Upload mode toggle */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 10 }}>HTML Quiz Content</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['file', 'paste'].map(m => (
                <button key={m} onClick={() => setUploadMode(m)}
                  style={{
                    padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 13,
                    background: uploadMode === m ? '#7c3aed' : '#f1f5f9',
                    color: uploadMode === m ? '#fff' : '#475569',
                  }}>
                  {m === 'file' ? '📁 Upload HTML File' : '✏️ Paste HTML Code'}
                </button>
              ))}
            </div>

            {uploadMode === 'file' ? (
              <input ref={fileRef} type="file" accept=".html,.htm"
                onChange={e => setForm(f => ({ ...f, file: e.target.files[0] || null }))}
                style={{ fontSize: 14 }}
              />
            ) : (
              <Textarea label="" value={form.html_content} onChange={e => setForm(f => ({ ...f, html_content: e.target.value }))}
                placeholder="Paste your HTML quiz code here..." style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 13 }}
              />
            )}
          </div>
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 14, color: msg.startsWith('✅') ? '#059669' : '#dc2626' }}>{msg}</div>}
        <button onClick={handleSubmit} disabled={saving} style={{ marginTop: 20, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : '+ Add Practice Test'}
        </button>
      </div>

      <ItemList items={items} loading={loading} onToggle={toggleVisibility} onDelete={deleteItem}
        renderMeta={item => `${item.subject || '—'} · Class ${item.class || 'All'}`} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SHARED: ItemList
// ──────────────────────────────────────────────────────────────────────────────
function ItemList({ items, loading, onToggle, onDelete, renderMeta }) {
  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Loading...</div>;
  if (!items.length) return <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>No items yet. Add one above!</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
        All Items ({items.length})
      </h3>
      {items.map(item => (
        <div key={item.id} style={{
          background: '#fff', borderRadius: 10, padding: '14px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          opacity: item.is_visible ? 1 : 0.55,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 2 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {renderMeta(item)} · {new Date(item.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => onToggle(item)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                background: item.is_visible ? '#dcfce7' : '#f1f5f9',
                color: item.is_visible ? '#16a34a' : '#64748b',
              }}
            >
              {item.is_visible ? '👁 Visible' : '🚫 Hidden'}
            </button>
            <button
              onClick={() => onDelete(item)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: '#fee2e2', color: '#dc2626',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
