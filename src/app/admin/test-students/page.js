// src/app/admin/test-students/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminAuth from '@/components/AdminAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CLASSES  = ['6th','7th','8th','9th','10th'];
const SECTIONS = ['Jinnah','Iqbal','Sir Syed','Liaqat','Tipu','Babar','Abdali'];

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

const LBL = { display:'block', fontWeight:600, fontSize:'0.78rem', color:textSec, marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.5px' };
const INP = { width:'100%', padding:'0.65rem 0.9rem', border:`1px solid ${borderLt}`, borderRadius:6, fontSize:'0.9rem', boxSizing:'border-box', background:navyDeep, color:cream };
const TD  = { padding:'0.75rem 1rem', color:cream, fontSize:'0.85rem', borderBottom:`1px solid ${border}` };
const TH  = { padding:'0.65rem 1rem', color:textSec, fontWeight:600, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.5px', background:navyDeep, textAlign:'left', borderBottom:`1px solid ${border}` };

function AdminTestStudentsInner() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [search,   setSearch]   = useState('');
  const [filterCl, setFilterCl] = useState('');
  const [form,     setForm]     = useState({ name:'', roll_no:'', class:'', section:'', password:'' });

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    setLoading(true);
    const { data } = await supabase
      .from('test_students')
      .select('id,name,roll_no,class,section,created_at')
      .order('class').order('roll_no');
    setStudents(data || []);
    setLoading(false);
  }

  async function hashPassword(password) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function addStudent(e) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const hash = await hashPassword(form.password);
    const { error } = await supabase.from('test_students').insert({
      name: form.name.trim(), roll_no: form.roll_no.trim(),
      class: form.class, section: form.section, password_hash: hash,
    });
    if (error) {
      setMsg('❌ ' + (error.message.includes('unique') ? 'A student with this roll number already exists in this class.' : error.message));
    } else {
      setMsg('✅ Student account created.');
      setForm({ name:'', roll_no:'', class:'', section:'', password:'' });
      await fetchStudents();
    }
    setSaving(false);
  }

  async function deleteStudent(id) {
    if (!confirm('Delete this student account?')) return;
    await supabase.from('test_students').delete().eq('id', id);
    await fetchStudents();
  }

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_no.includes(search);
    const matchClass  = !filterCl || s.class === filterCl;
    return matchSearch && matchClass;
  });

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
            <h1 style={{ margin:0, fontSize:'1.15rem', fontWeight:700, color:cream }}>Student Accounts</h1>
            <p style={{ margin:0, fontSize:'0.78rem', color:textSec }}>Manage student logins for the online test system</p>
          </div>
        </div>
        <a href="/admin/online-tests"
          style={{ background:navyDeep, color:'#c0d8f8', border:`1px solid ${border}`, borderRadius:8, padding:'0.6rem 1.2rem', textDecoration:'none', fontSize:'0.88rem' }}>
          ← Tests
        </a>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Message */}
        {msg && (
          <div style={{ background:msg.startsWith('❌') ? '#2d0e0e' : greenBg, border:`1px solid ${msg.startsWith('❌') ? '#f09595' : greenTx}`, borderRadius:8, padding:'0.9rem 1.2rem', marginBottom:'1.5rem', color:msg.startsWith('❌') ? '#f09595' : greenTx, fontSize:'0.9rem' }}>
            {msg}
          </div>
        )}

        {/* Add Student Form */}
        <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'2rem', marginBottom:'2rem' }}>
          <h2 style={{ margin:'0 0 1.5rem', color:cream, fontSize:'1.05rem' }}>Add Student Account</h2>
          <form onSubmit={addStudent}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={LBL}>Full Name *</label>
                <input style={INP} required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Muhammad Ali" />
              </div>
              <div>
                <label style={LBL}>Roll Number *</label>
                <input style={INP} required value={form.roll_no} onChange={e => setForm({...form, roll_no:e.target.value})} placeholder="e.g. 8-101" />
              </div>
              <div>
                <label style={LBL}>Class *</label>
                <select style={INP} required value={form.class} onChange={e => setForm({...form, class:e.target.value})}>
                  <option value="">Select Class</option>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Section *</label>
                <select style={INP} required value={form.section} onChange={e => setForm({...form, section:e.target.value})}>
                  <option value="">Select Section</option>
                  {SECTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={LBL}>Password *</label>
                <input style={INP} type="password" required value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Student's login password" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              style={{ marginTop:'1.5rem', background:gold, color:navy, border:'none', borderRadius:8, padding:'0.8rem 2rem', fontWeight:700, cursor:'pointer', opacity:saving ? 0.7 : 1, fontSize:'0.95rem' }}>
              {saving ? 'Saving…' : 'Add Student'}
            </button>
          </form>
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          <input style={{...INP, maxWidth:300}} placeholder="Search by name or roll number…" value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{...INP, maxWidth:200}} value={filterCl} onChange={e => setFilterCl(e.target.value)}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Students Table */}
        <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ margin:0, color:cream, fontSize:'0.95rem' }}>Students ({filtered.length})</h3>
          </div>
          {loading ? (
            <p style={{ padding:'2rem', color:textSec, textAlign:'center' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding:'2rem', color:textSec, textAlign:'center' }}>No students found.</p>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Name','Roll No','Class','Section','Added',''].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ background:navyMid }}>
                    <td style={TD}>{s.name}</td>
                    <td style={TD}><code style={{ background:navyDeep, padding:'0.2rem 0.5rem', borderRadius:4, color:goldLt, fontSize:'0.82rem' }}>{s.roll_no}</code></td>
                    <td style={TD}>{s.class}</td>
                    <td style={TD}>{s.section}</td>
                    <td style={{...TD, color:textMut, fontSize:'0.78rem'}}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={TD}>
                      <button onClick={() => deleteStudent(s.id)}
                        style={{ background:'#2d0e0e', color:'#f09595', border:'none', borderRadius:6, padding:'0.3rem 0.75rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ height:4, background:gold }} />
    </div>
  );
}


export default function AdminTestStudents() {
  return (
    <AdminAuth>
      <AdminTestStudentsInner />
    </AdminAuth>
  );
}
