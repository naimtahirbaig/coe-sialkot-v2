// src/app/admin/students/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminAuth from '@/components/AdminAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

const CLASSES  = ['6th','7th','8th','9th','10th'];
const SECTIONS = ['All','Jinnah','Iqbal','Sir Syed','Liaqat','Tipu','Babar','Abdali'];

const INP = {
  padding:'0.55rem 0.9rem', border:`1px solid ${borderLt}`, borderRadius:6,
  fontSize:'0.85rem', background:navyDeep, color:cream,
};
const TH = {
  padding:'0.6rem 1rem', color:textSec, fontWeight:600, fontSize:'0.75rem',
  textTransform:'uppercase', letterSpacing:'0.5px', background:navyDeep,
  textAlign:'left', borderBottom:`1px solid ${border}`, whiteSpace:'nowrap',
};
const TD = { padding:'0.65rem 1rem', color:cream, fontSize:'0.85rem', borderBottom:`1px solid ${border}` };

function AdminStudentsInner() {
  const [students,    setStudents]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [promoting,   setPromoting]   = useState(false);
  const [msg,         setMsg]         = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSec,   setFilterSec]   = useState('All');
  const [filterProm,  setFilterProm]  = useState('all');
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(new Set());

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    let list = [...students];
    if (filterClass) list = list.filter(s => s.current_class === filterClass);
    if (filterSec && filterSec !== 'All') list = list.filter(s => s.current_section === filterSec);
    if (filterProm === 'promoted')   list = list.filter(s => s.promoted);
    if (filterProm === 'pending')    list = list.filter(s => !s.promoted);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q) || (s.father_name || '').toLowerCase().includes(q));
    }
    setFiltered(list);
    setSelected(new Set());
  }, [students, filterClass, filterSec, filterProm, search]);

  async function fetchStudents() {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('current_class').order('current_section').order('name');
    setStudents(data || []);
    setLoading(false);
  }

  async function promoteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Promote ${selected.size} selected student(s) to next class?`)) return;
    setPromoting(true);
    const ids = [...selected];
    const { error } = await supabase
      .from('students')
      .update({ promoted: true, promoted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) setMsg('❌ Error: ' + error.message);
    else setMsg(`✅ ${ids.length} student(s) promoted successfully.`);
    await fetchStudents();
    setPromoting(false);
  }

  async function promoteAll() {
    const pending = filtered.filter(s => !s.promoted);
    if (pending.length === 0) { setMsg('All visible students are already promoted.'); return; }
    if (!confirm(`Promote ALL ${pending.length} visible pending students?`)) return;
    setPromoting(true);
    const ids = pending.map(s => s.id);
    const { error } = await supabase
      .from('students')
      .update({ promoted: true, promoted_at: new Date().toISOString() })
      .in('id', ids);
    if (error) setMsg('❌ Error: ' + error.message);
    else setMsg(`✅ ${ids.length} students promoted.`);
    await fetchStudents();
    setPromoting(false);
  }

  async function undoPromotion(id) {
    await supabase.from('students').update({ promoted: false, promoted_at: null }).eq('id', id);
    await fetchStudents();
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  }

  // Summary stats
  const total    = students.length;
  const promoted = students.filter(s => s.promoted).length;
  const pending  = total - promoted;

  // Breakdown by class
  const breakdown = {};
  students.forEach(s => {
    const key = `${s.current_class} ${s.current_section}`;
    if (!breakdown[key]) breakdown[key] = { total:0, promoted:0 };
    breakdown[key].total++;
    if (s.promoted) breakdown[key].promoted++;
  });

  return (
    <div style={{ minHeight:'100vh', background:navy, fontFamily:'Georgia, serif' }}>
      <div style={{ height:4, background:gold }} />

      {/* Header */}
      <div style={{ background:navyMid, borderBottom:`1px solid ${border}`, padding:'1.25rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:gold, border:`2px solid ${goldLt}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <img src="/logo.png" alt="COE" style={{ width:36, height:36, objectFit:'contain' }} />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:'1.15rem', fontWeight:700, color:cream }}>Student Promotion</h1>
            <p style={{ margin:0, fontSize:'0.78rem', color:textSec }}>COE Sialkot — Academic Year 2025–26 → 2026–27</p>
          </div>
        </div>
        <a href="/admin/online-tests" style={{ background:navyDeep, color:'#c0d8f8', border:`1px solid ${border}`, borderRadius:8, padding:'0.6rem 1.2rem', textDecoration:'none', fontSize:'0.85rem' }}>
          ← Admin
        </a>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Message */}
        {msg && (
          <div style={{ background:msg.startsWith('❌') ? '#2d0e0e' : greenBg, border:`1px solid ${msg.startsWith('❌') ? '#f09595' : greenTx}`, borderRadius:8, padding:'0.9rem 1.2rem', marginBottom:'1.5rem', color:msg.startsWith('❌') ? '#f09595' : greenTx, fontSize:'0.9rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>{msg}</span>
            <button onClick={() => setMsg('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:'1.1rem' }}>✕</button>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Total Students', value:total,    color:cream  },
            { label:'Promoted',       value:promoted, color:greenTx },
            { label:'Pending',        value:pending,  color:goldLt  },
          ].map(card => (
            <div key={card.label} style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:10, padding:'1.25rem 1.5rem', textAlign:'center' }}>
              <div style={{ color:card.color, fontSize:'2.2rem', fontWeight:700, lineHeight:1 }}>{card.value}</div>
              <div style={{ color:textSec, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'0.4rem' }}>{card.label}</div>
              <div style={{ marginTop:'0.75rem', height:4, background:navyDeep, borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${total > 0 ? (card.value/total*100) : 0}%`, background:card.color, borderRadius:4, transition:'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Class breakdown */}
        <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:10, padding:'1.25rem 1.5rem', marginBottom:'2rem' }}>
          <div style={{ color:textSec, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'1rem' }}>Breakdown by Class & Section</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'0.6rem' }}>
            {Object.entries(breakdown).sort().map(([key, val]) => (
              <div key={key} style={{ background:navyDeep, border:`1px solid ${border}`, borderRadius:8, padding:'0.75rem 1rem' }}>
                <div style={{ color:cream, fontSize:'0.85rem', fontWeight:600, marginBottom:'0.25rem' }}>{key}</div>
                <div style={{ color:val.promoted === val.total ? greenTx : goldLt, fontSize:'0.78rem' }}>
                  {val.promoted}/{val.total} promoted
                </div>
                <div style={{ marginTop:'0.4rem', height:3, background:navyMid, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${val.total > 0 ? val.promoted/val.total*100 : 0}%`, background:val.promoted === val.total ? greenTx : gold, borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <input style={{ ...INP, minWidth:200 }} placeholder="Search name, roll no, father…" value={search} onChange={e => setSearch(e.target.value)} />
          <select style={INP} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select style={INP} value={filterSec} onChange={e => setFilterSec(e.target.value)}>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select style={INP} value={filterProm} onChange={e => setFilterProm(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="promoted">Promoted</option>
          </select>

          <div style={{ marginLeft:'auto', display:'flex', gap:'0.5rem' }}>
            {selected.size > 0 && (
              <button onClick={promoteSelected} disabled={promoting}
                style={{ background:greenBg, color:greenTx, border:`1px solid ${greenTx}`, borderRadius:8, padding:'0.55rem 1.1rem', fontWeight:600, cursor:'pointer', fontSize:'0.85rem', opacity:promoting ? 0.7 : 1 }}>
                ✓ Promote Selected ({selected.size})
              </button>
            )}
            <button onClick={promoteAll} disabled={promoting}
              style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.55rem 1.2rem', fontWeight:700, cursor:'pointer', fontSize:'0.85rem', opacity:promoting ? 0.7 : 1 }}>
              {promoting ? 'Promoting…' : `Promote All Pending (${filtered.filter(s=>!s.promoted).length})`}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'0.9rem 1.25rem', borderBottom:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:cream, fontSize:'0.9rem', fontWeight:600 }}>Students ({filtered.length})</span>
            {selected.size > 0 && <span style={{ color:goldLt, fontSize:'0.82rem' }}>{selected.size} selected</span>}
          </div>

          {loading ? (
            <p style={{ padding:'2rem', color:textSec, textAlign:'center' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding:'2rem', color:textSec, textAlign:'center' }}>No students found.</p>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, width:36 }}>
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll}
                        style={{ accentColor:gold, cursor:'pointer' }} />
                    </th>
                    {['Roll No','Name','Father Name','Current Class','Next Class','Status','Action'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} style={{ background: selected.has(s.id) ? '#1a2d50' : navyMid }}>
                      <td style={{ ...TD, width:36 }}>
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)}
                          style={{ accentColor:gold, cursor:'pointer' }} />
                      </td>
                      <td style={{ ...TD }}>
                        <code style={{ background:navyDeep, padding:'2px 6px', borderRadius:4, color:goldLt, fontSize:'0.78rem' }}>{s.roll_no}</code>
                      </td>
                      <td style={{ ...TD, fontWeight:500 }}>{s.name}</td>
                      <td style={{ ...TD, color:textSec }}>{s.father_name}</td>
                      <td style={{ ...TD, color:textSec }}>{s.current_class} — {s.current_section}</td>
                      <td style={{ ...TD }}>
                        <span style={{ color:greenTx, fontWeight:600 }}>{s.next_class}</span>
                        <span style={{ color:textMut }}> — {s.next_section}</span>
                      </td>
                      <td style={{ ...TD }}>
                        {s.promoted ? (
                          <span style={{ background:greenBg, color:greenTx, padding:'2px 10px', borderRadius:12, fontSize:'0.72rem', fontWeight:600 }}>Promoted ✓</span>
                        ) : (
                          <span style={{ background:navyDeep, color:goldLt, border:`1px solid ${gold}`, padding:'2px 10px', borderRadius:12, fontSize:'0.72rem', fontWeight:600 }}>Pending</span>
                        )}
                      </td>
                      <td style={{ ...TD }}>
                        {s.promoted ? (
                          <button onClick={() => undoPromotion(s.id)}
                            style={{ background:'none', color:textMut, border:`1px solid ${border}`, borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:'0.72rem' }}>
                            Undo
                          </button>
                        ) : (
                          <button onClick={async () => { await supabase.from('students').update({ promoted:true, promoted_at: new Date().toISOString() }).eq('id', s.id); await fetchStudents(); }}
                            style={{ background:greenBg, color:greenTx, border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontSize:'0.72rem', fontWeight:600 }}>
                            Promote
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <div style={{ height:4, background:gold }} />
    </div>
  );
}


export default function AdminStudents() {
  return (
    <AdminAuth>
      <AdminStudentsInner />
    </AdminAuth>
  );
}
