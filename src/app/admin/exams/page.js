// src/app/admin/exams/page.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminAuth from '@/components/AdminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

const CLASSES  = ['6th','7th','8th'];
const SECTIONS = ['Jinnah','Iqbal','Sir Syed','Liaqat','Tipu','Babar','Abdali'];
const SUBJECTS = ['English','Mathematics','Urdu','Science','Islamiyat','Tarjuma','SST','Geography','Computer','FineArts'];
const SUBJECT_DISPLAY = {
  English:'English', Mathematics:'Mathematics', Urdu:'Urdu', Science:'Science',
  Islamiyat:'Islamiyat', Tarjuma:"Tarjuma Tul Qur'an", SST:'SST / History',
  Geography:'Geography', Computer:'Computer Science', FineArts:'Fine Arts',
};
const EXAM_TYPES = [
  { value:'monthly_1',  label:'Monthly Test 1' },
  { value:'monthly_2',  label:'Monthly Test 2' },
  { value:'monthly_3',  label:'Monthly Test 3' },
  { value:'first_term', label:'First Term'     },
  { value:'mid_term',   label:'Mid Term'       },
  { value:'final_term', label:'Final Term'     },
];

function getGrade(pct) {
  if (pct===null||pct===undefined) return '—';
  if (pct>=90) return 'A+';
  if (pct>=80) return 'A';
  if (pct>=70) return 'B';
  if (pct>=60) return 'C';
  if (pct>=50) return 'D';
  if (pct>=40) return 'E';
  return 'F';
}
function gradeColor(g) {
  return {'A+':'#7dd88a','A':'#a8d878','B':'#E8B84B','C':'#f0b060','D':'#f09595','E':'#e07070','F':'#c04040','Ab':textMut}[g]||textMut;
}

const TH = { padding:'0.55rem 0.75rem', color:textSec, fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.5px', background:navyDeep, textAlign:'center', borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' };
const TD = { padding:'0.5rem 0.75rem', fontSize:'0.82rem', textAlign:'center', borderBottom:`1px solid ${border}`, color:cream };
const INP = { padding:'0.6rem 0.9rem', border:`1px solid ${borderLt}`, borderRadius:6, fontSize:'0.85rem', background:navyDeep, color:cream };

function AdminExamsInner() {
  const [tab,          setTab]          = useState('exams');   // exams | results | logins
  const [exams,        setExams]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [creating,     setCreating]     = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState({ name:'', exam_type:'monthly_1', class:'6th' });
  const [msg,          setMsg]          = useState('');

  // Results state
  const [selExam,      setSelExam]      = useState('');
  const [selClass,     setSelClass]     = useState('6th');
  const [selSection,   setSelSection]   = useState('Jinnah');
  const [results,      setResults]      = useState([]);
  const [loadingRes,   setLoadingRes]   = useState(false);

  // Logins state
  const [teachers,     setTeachers]     = useState([]);
  const [filterClass,  setFilterClass]  = useState('6th');
  const [filterSec,    setFilterSec]    = useState('Jinnah');

  useEffect(() => { fetchExams(); fetchTeachers(); }, []);

  async function fetchExams() {
    setLoading(true);
    const { data } = await supabase.from('exams').select('*').order('created_at',{ascending:false});
    setExams(data||[]);
    setLoading(false);
  }

  async function fetchTeachers() {
    const { data } = await supabase.from('exam_teachers').select('*').order('class').order('section').order('subject');
    setTeachers(data||[]);
  }

  async function createExam(e) {
    e.preventDefault();
    setCreating(true);
    const { error } = await supabase.from('exams').insert({ name:form.name, exam_type:form.exam_type, class:form.class });
    if (error) setMsg('❌ '+error.message);
    else { setMsg('✅ Exam created.'); setShowForm(false); await fetchExams(); }
    setCreating(false);
  }

  async function toggleExam(ex) {
    await supabase.from('exams').update({ is_active:!ex.is_active }).eq('id',ex.id);
    await fetchExams();
  }

  async function deleteExam(id) {
    if (!confirm('Delete this exam and all its marks?')) return;
    await supabase.from('exams').delete().eq('id',id);
    await fetchExams();
  }

  async function loadResults() {
    if (!selExam) return;
    setLoadingRes(true);
    // Get students in this section
    const { data:studs } = await supabase.from('students').select('id,name,roll_no').eq('current_class',selClass).eq('current_section',selSection).order('name');
    // Get all marks for this exam + section students
    const studIds = (studs||[]).map(s=>s.id);
    const { data:marksData } = await supabase.from('exam_marks').select('*').eq('exam_id',selExam).in('student_id',studIds);

    // Build result rows
    const rows = (studs||[]).map(s => {
      const subjectMap = {};
      let totalObt=0, totalMax=0;
      SUBJECTS.forEach(sub => {
        const m = (marksData||[]).find(x=>x.student_id===s.id && x.subject===sub);
        subjectMap[sub] = m ? { obt:m.obtained_marks, total:m.total_marks, absent:m.is_absent } : null;
        if (m && !m.is_absent && m.obtained_marks!==null) { totalObt+=parseFloat(m.obtained_marks); totalMax+=m.total_marks; }
        else if (m && !m.is_absent) totalMax+=m.total_marks;
      });
      const pct   = totalMax>0 ? Math.round((totalObt/totalMax)*100) : null;
      const grade = getGrade(pct);
      return { ...s, subjectMap, totalObt, totalMax, pct, grade };
    });

    // Calculate positions
    const sorted = [...rows].filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct);
    sorted.forEach((r,i)=>{ r.position = i+1; });

    setResults(rows);
    setLoadingRes(false);
  }

  const filteredTeachers = teachers.filter(t=>t.class===filterClass && t.section===filterSec);

  // Summary stats for results
  const passed  = results.filter(r=>r.pct!==null && r.pct>=40).length;
  const failed  = results.filter(r=>r.pct!==null && r.pct<40).length;
  const avgPct  = results.length>0 ? Math.round(results.filter(r=>r.pct!==null).reduce((s,r)=>s+(r.pct||0),0)/results.filter(r=>r.pct!==null).length) : 0;
  const highest = results.reduce((m,r)=>r.pct>m?r.pct:m,0);

  return (
    <div style={{ minHeight:'100vh', background:navy, fontFamily:'Georgia, serif' }}>
      <div style={{ height:3, background:gold }} />
      <div style={{ background:navyMid, borderBottom:`1px solid ${border}`, padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:gold, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <img src="/logo.png" alt="" style={{ width:32, height:32, objectFit:'contain' }} />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, color:cream }}>Examination Portal</h1>
            <p style={{ margin:0, fontSize:'0.75rem', color:textSec }}>COE Sialkot — Admin</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {[['exams','Exams'],['results','Results'],['logins','Teacher Logins']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{ padding:'0.5rem 1.1rem', borderRadius:8, border:`1px solid ${t===tab?gold:border}`, background:t===tab?gold:navyDeep, color:t===tab?navy:textSec, fontWeight:t===tab?700:400, cursor:'pointer', fontSize:'0.82rem' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1.5rem' }}>
        {msg && <div style={{ background:msg.startsWith('❌')?'#2d0e0e':greenBg, border:`1px solid ${msg.startsWith('❌')?'#f09595':greenTx}`, borderRadius:8, padding:'0.9rem 1.2rem', marginBottom:'1.5rem', color:msg.startsWith('❌')?'#f09595':greenTx, fontSize:'0.9rem', display:'flex', justifyContent:'space-between' }}>
          <span>{msg}</span><button onClick={()=>setMsg('')} style={{ background:'none',border:'none',color:'inherit',cursor:'pointer' }}>✕</button>
        </div>}

        {/* ── TAB: EXAMS ── */}
        {tab==='exams' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ margin:0, color:cream, fontSize:'1.05rem' }}>Manage Exams</h2>
              <button onClick={()=>setShowForm(!showForm)} style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.6rem 1.4rem', fontWeight:700, cursor:'pointer', fontSize:'0.88rem' }}>
                {showForm?'✕ Cancel':'+ New Exam'}
              </button>
            </div>
            {showForm && (
              <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'1.75rem', marginBottom:'1.5rem' }}>
                <h3 style={{ margin:'0 0 1.25rem', color:cream, fontSize:'1rem' }}>Create New Exam</h3>
                <form onSubmit={createExam}>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                    <div>
                      <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Exam Name *</label>
                      <input required style={{ ...INP, width:'100%', boxSizing:'border-box' }} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Monthly Test 1 — 2025-26" />
                    </div>
                    <div>
                      <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Exam Type *</label>
                      <select style={{ ...INP, width:'100%', boxSizing:'border-box' }} value={form.exam_type} onChange={e=>setForm({...form,exam_type:e.target.value})}>
                        {EXAM_TYPES.map(et=><option key={et.value} value={et.value}>{et.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Class *</label>
                      <select style={{ ...INP, width:'100%', boxSizing:'border-box' }} value={form.class} onChange={e=>setForm({...form,class:e.target.value})}>
                        {CLASSES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={creating} style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.7rem 2rem', fontWeight:700, cursor:'pointer', opacity:creating?0.7:1 }}>
                    {creating?'Creating…':'Create Exam →'}
                  </button>
                </form>
              </div>
            )}
            {loading ? <p style={{ color:textSec }}>Loading…</p> : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {exams.map(ex=>(
                  <div key={ex.id} style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:10, padding:'1.1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.25rem' }}>
                        <span style={{ color:cream, fontWeight:600, fontSize:'0.95rem' }}>{ex.name}</span>
                        <span style={{ background:ex.is_active?greenBg:'#2d0e0e', color:ex.is_active?greenTx:'#f09595', padding:'2px 8px', borderRadius:12, fontSize:'0.7rem', fontWeight:600 }}>
                          {ex.is_active?'Active':'Closed'}
                        </span>
                      </div>
                      <div style={{ color:textSec, fontSize:'0.8rem' }}>{EXAM_TYPES.find(t=>t.value===ex.exam_type)?.label} &nbsp;·&nbsp; Class {ex.class} &nbsp;·&nbsp; {ex.academic_year}</div>
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button onClick={()=>toggleExam(ex)} style={{ background:ex.is_active?'#3d2808':greenBg, color:ex.is_active?'#f0b060':greenTx, border:'none', borderRadius:6, padding:'0.4rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                        {ex.is_active?'Close':'Reopen'}
                      </button>
                      <button onClick={()=>deleteExam(ex.id)} style={{ background:'#2d0e0e', color:'#f09595', border:'none', borderRadius:6, padding:'0.4rem 0.9rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>Delete</button>
                    </div>
                  </div>
                ))}
                {exams.length===0 && <div style={{ textAlign:'center', padding:'3rem', color:textSec, background:navyMid, borderRadius:12, border:`1px solid ${border}` }}>No exams yet. Create your first exam above.</div>}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: RESULTS ── */}
        {tab==='results' && (
          <div>
            <h2 style={{ margin:'0 0 1.5rem', color:cream, fontSize:'1.05rem' }}>Class Result Sheet</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'1rem', marginBottom:'1.5rem', alignItems:'end' }}>
              <div>
                <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Examination</label>
                <select style={{ ...INP, width:'100%', boxSizing:'border-box' }} value={selExam} onChange={e=>setSelExam(e.target.value)}>
                  <option value="">Select Exam</option>
                  {exams.filter(ex=>ex.class===selClass).map(ex=><option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Class</label>
                <select style={{ ...INP, width:'100%', boxSizing:'border-box' }} value={selClass} onChange={e=>{ setSelClass(e.target.value); setSelExam(''); }}>
                  {CLASSES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Section</label>
                <select style={{ ...INP, width:'100%', boxSizing:'border-box' }} value={selSection} onChange={e=>setSelSection(e.target.value)}>
                  {SECTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={loadResults} disabled={!selExam||loadingRes}
                style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.65rem 1.5rem', fontWeight:700, cursor:'pointer', fontSize:'0.88rem', opacity:(!selExam||loadingRes)?0.6:1, whiteSpace:'nowrap' }}>
                {loadingRes?'Loading…':'Load Results'}
              </button>
            </div>

            {results.length>0 && (
              <>
                {/* Summary */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
                  {[['Students',results.length,cream],['Passed',passed,greenTx],['Failed',failed,'#f09595'],['Class Avg',avgPct+'%',goldLt]].map(([l,v,c])=>(
                    <div key={l} style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:10, padding:'1rem', textAlign:'center' }}>
                      <div style={{ color:c, fontSize:'1.8rem', fontWeight:700 }}>{v}</div>
                      <div style={{ color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'0.25rem' }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Grade distribution */}
                <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:10, padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginRight:'0.5rem' }}>Grade Distribution:</span>
                  {['A+','A','B','C','D','E','F'].map(g=>{
                    const count=results.filter(r=>r.grade===g).length;
                    return count>0?<span key={g} style={{ background:navyDeep, border:`1px solid ${gradeColor(g)}`, color:gradeColor(g), padding:'3px 10px', borderRadius:12, fontSize:'0.75rem', fontWeight:600 }}>{g}: {count}</span>:null;
                  })}
                </div>

                {/* Results Table */}
                <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, overflow:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
                    <thead>
                      <tr>
                        <th style={{ ...TH, textAlign:'left' }}>Pos</th>
                        <th style={{ ...TH, textAlign:'left' }}>Roll No</th>
                        <th style={{ ...TH, textAlign:'left' }}>Student Name</th>
                        {SUBJECTS.map(s=><th key={s} style={TH}>{SUBJECT_DISPLAY[s].split(' ')[0]}</th>)}
                        <th style={TH}>Total</th>
                        <th style={TH}>%</th>
                        <th style={TH}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.sort((a,b)=>(b.pct||0)-(a.pct||0)).map((r,i)=>(
                        <tr key={r.id} style={{ background:i%2===0?navyMid:navyDeep }}>
                          <td style={{ ...TD, textAlign:'left', color:r.position<=3?goldLt:textMut, fontWeight:r.position<=3?700:400 }}>{r.position||'—'}</td>
                          <td style={{ ...TD, textAlign:'left' }}><code style={{ background:navyDeep, padding:'2px 5px', borderRadius:4, color:goldLt, fontSize:'0.75rem' }}>{r.roll_no}</code></td>
                          <td style={{ ...TD, textAlign:'left', color:cream, fontWeight:500 }}>{r.name}</td>
                          {SUBJECTS.map(sub=>{
                            const m=r.subjectMap[sub];
                            return <td key={sub} style={{ ...TD, color:m?.absent?textMut:m?.obt!==null?cream:textMut }}>
                              {m?.absent?'Ab':m?.obt!==null&&m?.obt!==undefined?m.obt:'—'}
                            </td>;
                          })}
                          <td style={{ ...TD, color:cream, fontWeight:600 }}>{r.totalObt}/{r.totalMax}</td>
                          <td style={{ ...TD, color:r.pct!==null?cream:textMut, fontWeight:600 }}>{r.pct!==null?r.pct+'%':'—'}</td>
                          <td style={{ ...TD, color:gradeColor(r.grade), fontWeight:700, fontSize:'0.9rem' }}>{r.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop:'1rem', display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={()=>window.print()} style={{ background:navyMid, color:'#c0d8f8', border:`1px solid ${border}`, borderRadius:8, padding:'0.6rem 1.4rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>
                    🖨️ Print Result Sheet
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: LOGINS ── */}
        {tab==='logins' && (
          <div>
            <h2 style={{ margin:'0 0 1.5rem', color:cream, fontSize:'1.05rem' }}>Teacher Login Credentials</h2>
            <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
              <select style={INP} value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
                {CLASSES.map(c=><option key={c}>{c}</option>)}
              </select>
              <select style={INP} value={filterSec} onChange={e=>setFilterSec(e.target.value)}>
                {SECTIONS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Subject','Login ID','Password'].map(h=><th key={h} style={{ ...TH, textAlign:'left' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((t,i)=>(
                    <tr key={t.id} style={{ background:i%2===0?navyMid:navyDeep }}>
                      <td style={{ ...TD, textAlign:'left', color:goldLt, fontWeight:500 }}>{t.subject_display}</td>
                      <td style={{ ...TD, textAlign:'left' }}><code style={{ color:cream, fontSize:'0.82rem' }}>{t.login}</code></td>
                      <td style={{ ...TD, textAlign:'left' }}><code style={{ color:textSec, fontSize:'0.82rem' }}>{t.password}</code></td>
                    </tr>
                  ))}
                  {filteredTeachers.length===0&&<tr><td colSpan={3} style={{ padding:'2rem', textAlign:'center', color:textSec }}>No teachers found for this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div style={{ height:3, background:gold }} />
      <style>{`@media print { button { display:none!important; } body { background:white!important; color:black!important; } }`}</style>
    </div>
  );
}

export default function AdminExams() {
  return <AdminAuth><AdminExamsInner /></AdminAuth>;
}
