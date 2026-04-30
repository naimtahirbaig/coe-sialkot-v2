// src/app/exam/teacher/page.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

function getGrade(pct) {
  if (pct === null || pct === undefined) return '—';
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'F';
}

function gradeColor(grade) {
  const map = { 'A+':'#7dd88a','A':'#a8d878','B':'#E8B84B','C':'#f0b060','D':'#f09595','E':'#e07070','F':'#c04040' };
  return map[grade] || textMut;
}

function TeacherLogin({ onLogin }) {
  const [login,    setLogin]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const { data, error } = await supabase
      .from('exam_teachers')
      .select('*')
      .eq('login', login.trim())
      .eq('password', password.trim())
      .single();
    if (error || !data) setError('Invalid login or password.');
    else onLogin(data);
    setLoading(false);
  }

  const F = { width:'100%', padding:'0.75rem 1rem', background:navyDeep, border:`1px solid ${borderLt}`, borderRadius:8, color:cream, fontSize:'0.95rem', boxSizing:'border-box', fontFamily:'Georgia, serif' };

  return (
    <div style={{ minHeight:'100vh', background:navy, display:'flex', flexDirection:'column', fontFamily:'Georgia, serif' }}>
      <div style={{ height:4, background:gold }} />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:gold, border:`3px solid ${goldLt}`, margin:'0 auto 1rem', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              <img src="/logo.png" alt="" style={{ width:64, height:64, objectFit:'contain' }} />
            </div>
            <h1 style={{ color:cream, margin:'0 0 0.25rem', fontSize:'1.3rem', fontWeight:700 }}>COE Sialkot</h1>
            <p style={{ color:textSec, margin:0, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.8px' }}>Teacher Examination Portal</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.75rem' }}>
            <div style={{ flex:1, height:1, background:gold }} /><span style={{ color:gold }}>⚜</span><div style={{ flex:1, height:1, background:gold }} />
          </div>
          <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'2rem' }}>
            <h2 style={{ color:goldLt, margin:'0 0 1.5rem', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', textAlign:'center' }}>Teacher Login</h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Login ID</label>
                <input required value={login} onChange={e => setLogin(e.target.value)} style={F} placeholder="coeskt@6jinnahenglish" />
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={F} placeholder="••••••••" />
              </div>
              {error && <div style={{ background:'#2d0e0e', color:'#f09595', border:'1px solid #f09595', padding:'0.7rem', borderRadius:8, marginBottom:'1rem', fontSize:'0.85rem', textAlign:'center' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.9rem', background:gold, color:navy, border:'none', borderRadius:10, fontSize:'1rem', fontWeight:700, cursor:'pointer', opacity:loading?0.7:1, fontFamily:'Georgia, serif' }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          </div>
          <p style={{ color:'#2a3f6a', fontSize:'0.7rem', textAlign:'center', marginTop:'1.5rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>Punjab Daanish Schools & COE Authority</p>
        </div>
      </div>
      <div style={{ height:4, background:gold }} />
    </div>
  );
}

function MarksEntry({ teacher }) {
  const [exams,        setExams]        = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students,     setStudents]     = useState([]);
  const [marks,        setMarks]        = useState({});
  const [totalMarks,   setTotalMarks]   = useState(100);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { loadExams(); loadStudents(); }, []);
  useEffect(() => { if (selectedExam) loadExistingMarks(); }, [selectedExam]);

  async function loadExams() {
    const { data } = await supabase.from('exams').select('*').eq('class', teacher.class).eq('is_active', true).order('created_at', { ascending:false });
    setExams(data || []);
    if (data?.length > 0) setSelectedExam(data[0]);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('id,name,roll_no').eq('current_class', teacher.class).eq('current_section', teacher.section).order('name');
    setStudents(data || []);
  }

  async function loadExistingMarks() {
    if (!selectedExam) return;
    setLoading(true);
    const { data } = await supabase.from('exam_marks').select('*').eq('exam_id', selectedExam.id).eq('subject', teacher.subject);
    if (data?.length > 0) {
      const m = {};
      data.forEach(row => { m[row.student_id] = { obtained: row.obtained_marks ?? '', absent: row.is_absent }; });
      setMarks(m);
      setTotalMarks(data[0].total_marks || 100);
    } else {
      setMarks({}); setTotalMarks(100);
    }
    setLoading(false);
  }

  async function saveMarks() {
    if (!selectedExam) return;
    setSaving(true); setSaved(false);
    const rows = students.map(s => ({
      exam_id:        selectedExam.id,
      student_id:     s.id,
      teacher_id:     teacher.id,
      subject:        teacher.subject,
      total_marks:    totalMarks,
      obtained_marks: marks[s.id]?.absent ? null : (parseFloat(marks[s.id]?.obtained) || null),
      is_absent:      marks[s.id]?.absent || false,
    }));
    const { error } = await supabase.from('exam_marks').upsert(rows, { onConflict:'exam_id,student_id,subject' });
    if (!error) setSaved(true);
    setSaving(false);
  }

  const enteredCount = students.filter(s => marks[s.id]?.absent || (marks[s.id]?.obtained !== '' && marks[s.id]?.obtained !== undefined)).length;

  return (
    <div style={{ minHeight:'100vh', background:navy, fontFamily:'Georgia, serif' }}>
      <div style={{ height:3, background:gold }} />
      <div style={{ background:navyMid, borderBottom:`1px solid ${border}`, padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:gold, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <img src="/logo.png" alt="" style={{ width:32, height:32, objectFit:'contain' }} />
          </div>
          <div>
            <div style={{ color:cream, fontSize:'0.95rem', fontWeight:700 }}>{teacher.subject_display} — {teacher.class} {teacher.section}</div>
            <div style={{ color:textSec, fontSize:'0.75rem' }}>{teacher.login}</div>
          </div>
        </div>
        <button onClick={() => { sessionStorage.removeItem('coe_teacher'); window.location.reload(); }}
          style={{ background:'#2d0e0e', color:'#f09595', border:'1px solid #f09595', borderRadius:6, padding:'0.35rem 0.9rem', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Exam + Total Marks */}
        <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'1.5rem', marginBottom:'1.5rem', display:'grid', gridTemplateColumns:'1fr 220px', gap:'1.5rem', alignItems:'end' }}>
          <div>
            <label style={{ display:'block', color:textSec, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.4rem', fontWeight:600 }}>Examination</label>
            {exams.length === 0
              ? <div style={{ color:textMut }}>No active exams. Ask admin to create one.</div>
              : <select value={selectedExam?.id||''} onChange={e => setSelectedExam(exams.find(x=>x.id===e.target.value))}
                  style={{ width:'100%', padding:'0.65rem 0.9rem', background:navyDeep, border:`1px solid ${borderLt}`, borderRadius:6, color:cream, fontSize:'0.9rem' }}>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
            }
          </div>
          <div>
            <label style={{ display:'block', color:textSec, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.4rem', fontWeight:600 }}>Total Marks</label>
            <input type="number" min={1} max={200} value={totalMarks} onChange={e => { setTotalMarks(parseInt(e.target.value)||100); setSaved(false); }}
              style={{ width:'100%', padding:'0.65rem 0.9rem', background:navyDeep, border:`2px solid ${gold}`, borderRadius:6, color:goldLt, fontSize:'1.2rem', fontWeight:700, textAlign:'center', boxSizing:'border-box' }} />
          </div>
        </div>

        {/* Progress + Save */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
          <div style={{ color:textSec, fontSize:'0.82rem' }}>
            <span style={{ color:cream, fontWeight:600 }}>{enteredCount}</span> / <span style={{ color:cream, fontWeight:600 }}>{students.length}</span> students entered
          </div>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            {saved && <span style={{ color:greenTx, fontSize:'0.82rem' }}>✓ Saved</span>}
            <button onClick={saveMarks} disabled={saving||!selectedExam}
              style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.6rem 1.5rem', fontWeight:700, cursor:'pointer', fontSize:'0.88rem', opacity:saving?0.7:1 }}>
              {saving ? 'Saving…' : '💾 Save Marks'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['#','Roll No','Student Name',`Obtained / ${totalMarks}`,'%','Grade','Absent'].map(h => (
                  <th key={h} style={{ padding:'0.65rem 1rem', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', background:navyDeep, textAlign:h==='Student Name'?'left':'center', borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:textSec }}>Loading…</td></tr>
                : students.map((s,i) => {
                    const ob     = marks[s.id]?.obtained;
                    const absent = marks[s.id]?.absent;
                    const pct    = (!absent && ob!==''&&ob!==undefined) ? Math.round((parseFloat(ob)/totalMarks)*100) : null;
                    const grade  = absent ? 'Ab' : getGrade(pct);
                    const gcol   = absent ? textMut : gradeColor(grade);
                    return (
                      <tr key={s.id} style={{ background:i%2===0?navyMid:navyDeep }}>
                        <td style={{ padding:'0.6rem 1rem', color:textMut, fontSize:'0.8rem', textAlign:'center', borderBottom:`1px solid ${border}` }}>{i+1}</td>
                        <td style={{ padding:'0.6rem 1rem', textAlign:'center', borderBottom:`1px solid ${border}` }}>
                          <code style={{ background:navyDeep, padding:'2px 6px', borderRadius:4, color:goldLt, fontSize:'0.78rem' }}>{s.roll_no}</code>
                        </td>
                        <td style={{ padding:'0.6rem 1rem', color:absent?textMut:cream, fontWeight:500, fontSize:'0.88rem', borderBottom:`1px solid ${border}`, textDecoration:absent?'line-through':'none' }}>{s.name}</td>
                        <td style={{ padding:'0.4rem 0.75rem', textAlign:'center', borderBottom:`1px solid ${border}` }}>
                          {!absent && <input type="number" min={0} max={totalMarks} value={ob??''} onChange={e => { setMarks(p=>({...p,[s.id]:{...p[s.id],obtained:e.target.value,absent:false}})); setSaved(false); }}
                            style={{ width:80, padding:'0.4rem 0.5rem', background:navyDeep, border:`1px solid ${borderLt}`, borderRadius:6, color:cream, fontSize:'0.9rem', textAlign:'center', fontFamily:'Georgia,serif' }} placeholder="—" />}
                        </td>
                        <td style={{ padding:'0.6rem 1rem', textAlign:'center', color:pct!==null?cream:textMut, fontSize:'0.85rem', fontWeight:600, borderBottom:`1px solid ${border}` }}>{absent?'—':pct!==null?`${pct}%`:'—'}</td>
                        <td style={{ padding:'0.6rem 1rem', textAlign:'center', color:gcol, fontSize:'0.88rem', fontWeight:700, borderBottom:`1px solid ${border}` }}>{grade}</td>
                        <td style={{ padding:'0.6rem 1rem', textAlign:'center', borderBottom:`1px solid ${border}` }}>
                          <input type="checkbox" checked={absent||false} onChange={()=>{ setMarks(p=>({...p,[s.id]:{obtained:'',absent:!p[s.id]?.absent}})); setSaved(false); }}
                            style={{ accentColor:'#f09595', cursor:'pointer', width:16, height:16 }} />
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        <div style={{ marginTop:'1.5rem', display:'flex', justifyContent:'flex-end', gap:'1rem', alignItems:'center' }}>
          {saved && <span style={{ color:greenTx, fontSize:'0.85rem' }}>✓ All marks saved successfully</span>}
          <button onClick={saveMarks} disabled={saving||!selectedExam}
            style={{ background:gold, color:navy, border:'none', borderRadius:8, padding:'0.8rem 2.5rem', fontWeight:700, cursor:'pointer', fontSize:'0.95rem', opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : '💾 Save Marks'}
          </button>
        </div>
      </div>
      <div style={{ height:3, background:gold }} />
    </div>
  );
}

export default function TeacherPortal() {
  const [teacher, setTeacher] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('coe_teacher');
    if (saved) setTeacher(JSON.parse(saved));
    setChecked(true);
  }, []);

  function handleLogin(t) {
    sessionStorage.setItem('coe_teacher', JSON.stringify(t));
    setTeacher(t);
  }

  if (!checked) return null;
  if (!teacher)  return <TeacherLogin onLogin={handleLogin} />;
  return <MarksEntry teacher={teacher} />;
}
