// src/app/admin/online-tests/page.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CLASSES  = ['6th', '7th', '8th', '9th', '10th'];
const SUBJECTS = ['Physics','Chemistry','Biology','Mathematics','English','Urdu',
  'Pakistan Studies','Islamiat','Computer',"Tarjuma Tul Qur'an",'Fine Arts','History','Geography'];

// ── COE colour tokens ─────────────────────────────────────────
const navy     = '#0E1F3D';
const navyMid  = '#162a50';
const navyDeep = '#0a1628';
const gold     = '#C9922A';
const goldLt   = '#E8B84B';
const cream    = '#F5E6C3';
const textSec  = '#9ab0d8';
const textMut  = '#7090b8';
const border   = '#2e4a80';
const borderLt = '#3a5a90';
const greenBg  = '#1a4025';
const greenTx  = '#7dd88a';
const draftBg  = '#3d2808';
const draftTx  = '#f0b060';

const LBL = { display:'block', fontWeight:600, fontSize:'0.78rem', color:textSec, marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.5px' };
const INP = { width:'100%', padding:'0.65rem 0.9rem', border:`1px solid ${borderLt}`, borderRadius:6, fontSize:'0.9rem', boxSizing:'border-box', background:navyDeep, color:cream };

export default function AdminOnlineTests() {
  const [tests,         setTests]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [creating,      setCreating]      = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [uploadTestId,  setUploadTestId]  = useState(null);
  const [uploadStatus,  setUploadStatus]  = useState('');
  const [msg,           setMsg]           = useState('');
  const [files,         setFiles]         = useState({ testFile:null, keyFile:null });
  const [form,          setForm]          = useState({
    title:'', description:'', subject:'', class:'',
    passing_marks:'', time_limit_objective:60, time_limit_short:300,
  });

  useEffect(() => { fetchTests(); }, []);

  async function fetchTests() {
    setLoading(true);
    const { data } = await supabase.from('online_tests').select('*').order('created_at', { ascending:false });
    setTests(data || []);
    setLoading(false);
  }

  async function createTest(e) {
    e.preventDefault();
    setCreating(true); setMsg('');
    const { data, error } = await supabase.from('online_tests').insert({
      title: form.title, description: form.description,
      subject: form.subject, class: form.class,
      passing_marks: parseInt(form.passing_marks),
      time_limit_objective: parseInt(form.time_limit_objective),
      time_limit_short: parseInt(form.time_limit_short),
      status: 'draft',
    }).select().single();
    if (error) { setMsg('Error: ' + error.message); setCreating(false); return; }
    setMsg('✅ Test created! Now upload the question paper and answer key.');
    setUploadTestId(data.id);
    setShowForm(false);
    await fetchTests();
    setCreating(false);
  }

  async function uploadFiles(e) {
    e.preventDefault();
    if (!files.testFile || !files.keyFile || !uploadTestId) { setUploadStatus('Please select both files.'); return; }
    setUploading(true);
    setUploadStatus('⏳ Parsing with AI… this may take 30–60 seconds.');
    const fd = new FormData();
    fd.append('testFile', files.testFile);
    fd.append('keyFile',  files.keyFile);
    fd.append('testId',   uploadTestId);
    const res  = await fetch('/api/parse-test', { method:'POST', body:fd });
    const data = await res.json();
    if (!res.ok) { setUploadStatus('❌ ' + (data.error || 'Parse failed')); setUploading(false); return; }
    setUploadStatus(`✅ Parsed ${data.questionsCount} questions (${data.totalMarks} total marks).`);
    setUploading(false);
    await fetchTests();
  }

  async function toggleStatus(test) {
    const next = test.status === 'active' ? 'closed' : 'active';
    await supabase.from('online_tests').update({ status:next }).eq('id', test.id);
    await fetchTests();
  }

  async function deleteTest(id) {
    if (!confirm('Delete this test and all its questions?')) return;
    await supabase.from('online_tests').delete().eq('id', id);
    await fetchTests();
  }

  function badgeStyle(s) {
    if (s === 'active') return { background:greenBg, color:greenTx };
    if (s === 'draft')  return { background:draftBg, color:draftTx };
    return { background:navyDeep, color:textMut };
  }

  return (
    <div style={{ minHeight:'100vh', background:navy, fontFamily:'Georgia, serif' }}>
      <div style={{ height:4, background:gold }} />

      {/* Header */}
      <div style={{ background:navyMid, borderBottom:`1px solid ${border}`, padding:'1.25rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:gold, border:`2px solid ${goldLt}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <img src="/logo.png" alt="COE" style={{ width:36, height:36, objectFit:'contain' }} />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:'1.15rem', fontWeight:700, color:cream }}>Online Test Manager</h1>
            <p style={{ margin:0, fontSize:'0.78rem', color:textSec }}>COE Sialkot — Admin Panel</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setMsg(''); }}
          style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.65rem 1.4rem', fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}>
          {showForm ? '✕ Cancel' : '+ Create Test'}
        </button>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Message bar */}
        {msg && (
          <div style={{ background:msg.startsWith('✅') ? greenBg : draftBg, border:`1px solid ${msg.startsWith('✅') ? greenTx : draftTx}`, borderRadius:8, padding:'0.9rem 1.2rem', marginBottom:'1.5rem', color:msg.startsWith('✅') ? greenTx : draftTx, fontSize:'0.9rem' }}>
            {msg}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'2rem', marginBottom:'2rem' }}>
            <h2 style={{ margin:'0 0 1.5rem', color:cream, fontSize:'1.05rem' }}>New Test Details</h2>
            <form onSubmit={createTest}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={LBL}>Test Title *</label>
                  <input style={INP} required value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="e.g. 1st Monthly Test — Physics Grade 8" />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={LBL}>Description</label>
                  <textarea style={{...INP, height:80, resize:'vertical'}} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Instructions for students…" />
                </div>
                <div>
                  <label style={LBL}>Class *</label>
                  <select style={INP} required value={form.class} onChange={e => setForm({...form, class:e.target.value})}>
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Subject *</label>
                  <select style={INP} required value={form.subject} onChange={e => setForm({...form, subject:e.target.value})}>
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Passing Marks *</label>
                  <input style={INP} type="number" required min={1} value={form.passing_marks} onChange={e => setForm({...form, passing_marks:e.target.value})} placeholder="e.g. 15" />
                </div>
                <div>
                  <label style={LBL}>Time per Objective Question (sec)</label>
                  <input style={INP} type="number" min={30} value={form.time_limit_objective} onChange={e => setForm({...form, time_limit_objective:e.target.value})} />
                </div>
                <div>
                  <label style={LBL}>Time per Short Question (sec)</label>
                  <input style={INP} type="number" min={60} value={form.time_limit_short} onChange={e => setForm({...form, time_limit_short:e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={creating}
                style={{ marginTop:'1.5rem', background:gold, color:navy, border:'none', borderRadius:8, padding:'0.8rem 2rem', fontWeight:700, cursor:'pointer', opacity:creating ? 0.7 : 1, fontSize:'0.95rem' }}>
                {creating ? 'Creating…' : 'Create Test →'}
              </button>
            </form>
          </div>
        )}

        {/* Upload section */}
        {uploadTestId && (
          <div style={{ background:navyMid, border:`2px solid ${gold}`, borderRadius:12, padding:'2rem', marginBottom:'2rem' }}>
            <h2 style={{ margin:'0 0 0.4rem', color:goldLt, fontSize:'1.05rem' }}>📄 Upload Test Files</h2>
            <p style={{ margin:'0 0 1.5rem', color:textSec, fontSize:'0.85rem' }}>Upload the question paper and answer key. AI will extract all questions automatically.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
              <div>
                <label style={LBL}>Question Paper (PDF or Word) *</label>
                <input type="file" accept=".pdf,.doc,.docx" style={{...INP, color:textSec}} onChange={e => setFiles({...files, testFile:e.target.files[0]})} />
              </div>
              <div>
                <label style={LBL}>Answer Key (PDF or Word) *</label>
                <input type="file" accept=".pdf,.doc,.docx" style={{...INP, color:textSec}} onChange={e => setFiles({...files, keyFile:e.target.files[0]})} />
              </div>
            </div>
            {uploadStatus && (
              <div style={{ padding:'0.75rem 1rem', borderRadius:8, background:uploadStatus.startsWith('❌') ? draftBg : greenBg, color:uploadStatus.startsWith('❌') ? draftTx : greenTx, border:`1px solid ${uploadStatus.startsWith('❌') ? draftTx : greenTx}`, marginBottom:'1rem', fontSize:'0.88rem' }}>
                {uploadStatus}
              </div>
            )}
            <button onClick={uploadFiles} disabled={uploading}
              style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.8rem 2rem', fontWeight:700, cursor:'pointer', opacity:uploading ? 0.7 : 1, fontSize:'0.9rem' }}>
              {uploading ? '⏳ Parsing…' : '🤖 Upload & Parse with AI'}
            </button>
          </div>
        )}

        {/* Tests list */}
        <div style={{ color:textSec, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'0.75rem' }}>
          All Tests ({tests.length})
        </div>

        {loading ? (
          <p style={{ color:textSec, textAlign:'center', padding:'2rem' }}>Loading…</p>
        ) : tests.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', background:navyMid, borderRadius:12, border:`1px solid ${border}` }}>
            <p style={{ fontSize:'2rem', margin:'0 0 0.5rem' }}>📋</p>
            <p style={{ color:textSec }}>No tests yet. Create your first test above.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {tests.map(test => (
              <div key={test.id} style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'1.25rem 1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.35rem' }}>
                      <h3 style={{ margin:0, color:cream, fontSize:'0.95rem', fontWeight:600 }}>{test.title}</h3>
                      <span style={{ ...badgeStyle(test.status), padding:'0.2rem 0.7rem', borderRadius:20, fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase' }}>
                        {test.status}
                      </span>
                    </div>
                    <p style={{ margin:0, color:textSec, fontSize:'0.83rem' }}>
                      {test.class} &nbsp;·&nbsp; {test.subject} &nbsp;·&nbsp; {test.total_marks} marks &nbsp;·&nbsp; Pass: {test.passing_marks}
                    </p>
                    {test.description && <p style={{ margin:'0.35rem 0 0', color:textMut, fontSize:'0.78rem', fontStyle:'italic' }}>{test.description}</p>}
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                    <button onClick={() => setUploadTestId(test.id)}
                      style={{ background:navyDeep, color:'#c0d8f8', border:`1px solid ${border}`, borderRadius:6, padding:'0.45rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                      📄 Re-upload
                    </button>
                    <button onClick={() => toggleStatus(test)}
                      style={{ background:test.status === 'active' ? draftBg : greenBg, color:test.status === 'active' ? draftTx : greenTx, border:'none', borderRadius:6, padding:'0.45rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                      {test.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}
                    </button>
                    <button onClick={() => deleteTest(test.id)}
                      style={{ background:'#2d0e0e', color:'#f09595', border:'none', borderRadius:6, padding:'0.45rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
                <div style={{ marginTop:'0.9rem', paddingTop:'0.9rem', borderTop:`1px solid ${border}`, display:'flex', gap:'2rem', fontSize:'0.75rem', color:textMut, flexWrap:'wrap' }}>
                  <span>⏱ Objective: {test.time_limit_objective}s/q</span>
                  <span>⏱ Short: {test.time_limit_short}s/q</span>
                  <span style={{ color:goldLt }}>🔗 /practice-tests/online?test={test.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Student management link */}
        <div style={{ marginTop:'2rem', background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <p style={{ margin:'0 0 0.2rem', color:cream, fontWeight:600, fontSize:'0.95rem' }}>👥 Student Account Management</p>
            <p style={{ margin:0, color:textSec, fontSize:'0.83rem' }}>Create and manage student logins for the test system.</p>
          </div>
          <a href="/admin/test-students"
            style={{ background:gold, color:navy, padding:'0.7rem 1.4rem', borderRadius:8, textDecoration:'none', fontWeight:700, fontSize:'0.88rem' }}>
            Manage Students →
          </a>
        </div>
      </div>

      <div style={{ height:4, background:gold }} />
    </div>
  );
}
