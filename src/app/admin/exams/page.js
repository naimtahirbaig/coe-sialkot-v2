// src/app/admin/exams/page.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminAuth from '@/components/AdminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const navy    = '#0E1F3D';
const navyMid = '#162a50';
const navyDeep= '#0a1628';
const gold    = '#C9922A';
const goldLt  = '#E8B84B';
const cream   = '#F5E6C3';
const textSec = '#9ab0d8';
const textMut = '#7090b8';
const border  = '#2e4a80';
const borderLt= '#3a5a90';
const greenBg = '#1a4025';
const greenTx = '#7dd88a';

const CLASSES  = ['6th','7th','8th'];
const SECTIONS = ['Jinnah','Iqbal','Sir Syed','Liaqat','Tipu','Babar','Abdali'];
const SUBJECTS = ['English','Mathematics','Urdu','Science','Islamiyat','Tarjuma','SST','Geography','Computer','FineArts'];
const SDISPLAY = { English:'English', Mathematics:'Mathematics', Urdu:'Urdu', Science:'Science', Islamiyat:'Islamiyat', Tarjuma:"Tarjuma Tul Qur'an", SST:'SST / History', Geography:'Geography', Computer:'Computer Science', FineArts:'Fine Arts' };
const EXAM_TYPES = [
  {value:'monthly_1',label:'Monthly Test 1'},{value:'monthly_2',label:'Monthly Test 2'},
  {value:'monthly_3',label:'Monthly Test 3'},{value:'first_term',label:'First Term'},
  {value:'mid_term',label:'Mid Term'},{value:'final_term',label:'Final Term'},
];
const REMARKS = {'A+':'Outstanding','A':'Excellent','B':'Very Good','C':'Good','D':'Satisfactory','E':'Needs Improvement','F':'Fail','Ab':'Absent'};

function grade(pct) {
  if (pct===null||pct===undefined) return '—';
  if (pct>=90) return 'A+'; if (pct>=80) return 'A'; if (pct>=70) return 'B';
  if (pct>=60) return 'C';  if (pct>=50) return 'D'; if (pct>=40) return 'E';
  return 'F';
}
function gc(g) {
  return {'A+':'#22c55e','A':'#4ade80','B':'#E8B84B','C':'#f0b060','D':'#f09595','E':'#e07070','F':'#c04040','Ab':'#6b7280','—':'#7090b8'}[g]||'#7090b8';
}

const TH = {padding:'0.4rem 0.5rem',color:'#9ab0d8',fontSize:'0.62rem',textTransform:'uppercase',letterSpacing:'0.4px',background:'#0a1628',textAlign:'center',border:'1px solid #2e4a80',whiteSpace:'nowrap'};
const TD = {padding:'0.4rem 0.5rem',fontSize:'0.75rem',textAlign:'center',border:'1px solid #2e4a80',color:'#F5E6C3'};
const INP= {padding:'0.6rem 0.9rem',border:'1px solid #3a5a90',borderRadius:6,fontSize:'0.85rem',background:'#0a1628',color:'#F5E6C3'};

function buildCard(s, examName, top3) {
  const rows = SUBJECTS.map((sub,i)=>{
    const m=s.subjectMap[sub];
    if(!m) return '';
    const p   = m.absent?null:m.total>0?Math.round(m.obt/m.total*100):null;
    const g   = m.absent?'Ab':grade(p);
    const gc2 = {'A+':'#16a34a','A':'#15803d','B':'#ca8a04','C':'#d97706','D':'#dc2626','E':'#991b1b','F':'#7f1d1d','Ab':'#6b7280'}[g]||'#333';
    return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:12px;color:#777">${i+1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;color:#1a1a2e;font-weight:500">${SDISPLAY[sub]}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:13px">${m.total}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:13px;font-weight:600">${m.absent?'Ab':m.obt??'—'}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:13px">${m.absent||p===null?'—':p+'%'}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:13px;font-weight:700;color:${gc2}">${g}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:12px;color:${gc2}">${REMARKS[g]||'—'}</td>
    </tr>`;
  }).join('');

  const g   = grade(s.pct);
  const gc2 = {'A+':'#16a34a','A':'#15803d','B':'#ca8a04','C':'#d97706','D':'#dc2626','E':'#991b1b','F':'#7f1d1d'}[g]||'#333';
  const rmk = s.pct>=90?'Outstanding performance! Keep up the excellent work.':s.pct>=80?'Excellent work! Continue the great effort.':s.pct>=70?'Very good performance. Aim higher next time.':s.pct>=60?'Good effort. There is room for improvement.':s.pct>=50?'Satisfactory. Focus more on your studies.':'Needs significant improvement. Please work harder.';

  const t3 = top3.slice(0,3).map((t,i)=>{
    const cols=['#1d4ed8','#0369a1','#0e7490'];
    const lbl=['1st Position','2nd Position','3rd Position'];
    return `<td style="border:1px solid #ddd;padding:8px;text-align:center;background:${cols[i]}15;width:33%">
      <div style="font-size:10px;color:${cols[i]};font-weight:700;margin-bottom:3px">${lbl[i]}</div>
      <div style="font-size:13px;font-weight:700;color:#1a1a2e">${t.name}</div>
      <div style="font-size:10px;color:#555">S/O: ${t.father_name||''}</div>
      <div style="font-size:11px;font-weight:600;color:${cols[i]};margin-top:2px">${t.totalObt}/${t.totalMax} (${t.pct}%)</div>
    </td>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Result — ${s.name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#f0f0f0}
.page{width:210mm;min-height:297mm;background:#fff;margin:0 auto;padding:14mm 12mm}
.band{height:5px;background:linear-gradient(90deg,#1d4ed8,#C9922A);border-radius:2px}
.band2{background:linear-gradient(90deg,#C9922A,#1d4ed8)}
.hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:10px;margin:10px 0}
.logo{width:65px;height:65px;object-fit:contain}
.sc{text-align:center;flex:1}
.sc h1{font-size:24px;font-weight:900;color:#1a1a2e;letter-spacing:2px;text-transform:uppercase}
.sc h2{font-size:13px;color:#555;font-weight:normal;margin-top:2px}
.badge{background:linear-gradient(135deg,#1d4ed8,#0369a1);color:#fff;text-align:center;padding:8px;border-radius:5px;margin-bottom:12px}
.badge h3{font-size:16px;font-weight:700;letter-spacing:1px}
.badge p{font-size:11px;opacity:0.85;margin-top:2px}
.igrid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #ddd;margin-bottom:12px}
.ic{padding:6px 10px;border:1px solid #ddd}
.ilbl{font-size:10px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:1px}
.ival{color:#1a1a2e;font-weight:600;font-size:13px}
.ival.hi{color:#1d4ed8;font-size:14px}
.stl{font-size:13px;font-weight:700;color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:3px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px}
table{width:100%;border-collapse:collapse;margin-bottom:12px}
.tr{background:#1d4ed8;color:#fff}.tr th{padding:7px 8px;border:1px solid #1565c0;font-size:11px}
.tot td{background:#1d4ed8;color:#fff!important;font-weight:700;padding:7px 8px;font-size:12px}
.gbar{display:flex;gap:3px;margin-bottom:12px}
.gi{flex:1;text-align:center;padding:4px 2px;border-radius:3px;font-size:9px;font-weight:700;color:#fff}
.rmk{border:1px solid #ddd;border-radius:5px;padding:8px 12px;background:#f0fdf4;font-size:12px;color:#166534;min-height:36px;margin-bottom:14px}
.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:18px}
.sb{text-align:center}
.sl{border-top:1px solid #333;margin-bottom:5px}
.sn{font-weight:700;font-size:12px;color:#1a1a2e}
.sr{font-size:10px;color:#555;margin-top:1px}
.ft{text-align:center;margin-top:14px;font-size:9px;color:#aaa;font-style:italic;border-top:1px solid #eee;padding-top:6px}
@media print{body{background:#fff}.page{margin:0;box-shadow:none}}
</style></head><body><div class="page">
<div class="band"></div>
<div class="hdr">
  <img src="/logo.png" class="logo" onerror="this.style.display='none'"/>
  <div class="sc"><h1>Center of Excellence</h1><h2>BOYS SIALKOT</h2></div>
  <img src="/logo.png" class="logo" onerror="this.style.display='none'"/>
</div>
<div class="badge"><h3>PROGRESS REPORT CARD</h3><p>${examName}</p></div>
<div class="igrid">
  <div class="ic"><div class="ilbl">Student Name</div><div class="ival">${s.name}</div></div>
  <div class="ic"><div class="ilbl">Roll Number</div><div class="ival">${s.roll_no}</div></div>
  <div class="ic"><div class="ilbl">Father's Name</div><div class="ival">${s.father_name||'—'}</div></div>
  <div class="ic"><div class="ilbl">Class</div><div class="ival">${s.current_class} ${s.current_section}</div></div>
  <div class="ic"><div class="ilbl">Examination</div><div class="ival">${examName}</div></div>
  <div class="ic"><div class="ilbl">Position in Class</div><div class="ival hi">${s.position||'—'} / ${s.classTotal||'—'}</div></div>
</div>
<div class="stl">Academic Performance</div>
<table><thead><tr class="tr">
  <th>#</th><th style="text-align:left">Subject</th><th>Max</th><th>Obt.</th><th>%</th><th>Grade</th><th>Remarks</th>
</tr></thead><tbody>
${rows}
<tr class="tot">
  <td colspan="2" style="text-align:left;border:1px solid #1565c0">GRAND TOTAL</td>
  <td style="border:1px solid #1565c0">${s.totalMax}</td>
  <td style="border:1px solid #1565c0">${s.totalObt}</td>
  <td style="border:1px solid #1565c0">${s.pct!==null?s.pct+'%':'—'}</td>
  <td style="border:1px solid #1565c0;color:${gc2}!important">${g}</td>
  <td style="border:1px solid #1565c0">${REMARKS[g]||'—'}</td>
</tr></tbody></table>
<div class="stl">Grading Criteria</div>
<div class="gbar">
  ${[['A+','90+','#16a34a'],['A','80-89','#15803d'],['B','70-79','#ca8a04'],['C','60-69','#d97706'],['D','50-59','#dc2626'],['E','40-49','#991b1b'],['F','<40','#7f1d1d']].map(([g,r,c])=>`<div class="gi" style="background:${c}">${g}<br><span style="font-weight:400">${r}%</span></div>`).join('')}
</div>
${top3.length>0?`<div class="stl">Top Three Positions</div><table><tr>${t3}</tr></table>`:''}
<div class="stl">Teacher's Remarks</div>
<div class="rmk">${rmk}</div>
<div class="sigs">
  <div class="sb"><div style="height:32px"></div><div class="sl"></div><div class="sn">Class Teacher</div><div class="sr">Date:___/___/2026</div></div>
  <div class="sb"><div style="height:32px"></div><div class="sl"></div><div class="sn">Dr Naim Tahir Baig</div><div class="sr">Senior Coordinator<br>Date:___/___/2026</div></div>
  <div class="sb"><div style="height:32px"></div><div class="sl"></div><div class="sn">Sir Shahbaz Hassan</div><div class="sr">Principal<br>School Stamp</div></div>
</div>
<div class="band2" style="margin-top:14px"></div>
<div class="ft">This is a computer-generated document. Parent's signature is required.</div>
</div></body></html>`;
}

function AdminExamsInner() {
  const [tab,        setTab]        = useState('exams');
  const [exams,      setExams]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({name:'',exam_type:'monthly_1',class:'6th'});
  const [msg,        setMsg]        = useState('');
  const [selExam,    setSelExam]    = useState('');
  const [selClass,   setSelClass]   = useState('6th');
  const [selSection, setSelSection] = useState('Jinnah');
  const [results,    setResults]    = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [teachers,   setTeachers]   = useState([]);
  const [fClass,     setFClass]     = useState('6th');
  const [fSec,       setFSec]       = useState('Jinnah');

  useEffect(()=>{fetchExams();fetchTeachers();},[]);

  async function fetchExams(){
    setLoading(true);
    const{data}=await supabase.from('exams').select('*').order('created_at',{ascending:false});
    setExams(data||[]);setLoading(false);
  }
  async function fetchTeachers(){
    const{data}=await supabase.from('exam_teachers').select('*').order('class').order('section').order('subject');
    setTeachers(data||[]);
  }
  async function createExam(e){
    e.preventDefault();setCreating(true);
    const{error}=await supabase.from('exams').insert({name:form.name,exam_type:form.exam_type,class:form.class});
    if(error)setMsg('❌ '+error.message);
    else{setMsg('✅ Exam created.');setShowForm(false);await fetchExams();}
    setCreating(false);
  }
  async function toggleExam(ex){
    await supabase.from('exams').update({is_active:!ex.is_active}).eq('id',ex.id);await fetchExams();
  }
  async function deleteExam(id){
    if(!confirm('Delete this exam and all its marks?'))return;
    await supabase.from('exams').delete().eq('id',id);await fetchExams();
  }

  async function loadResults(){
    if(!selExam)return;
    setLoadingRes(true);
    const{data:studs}=await supabase.from('students').select('*').eq('current_class',selClass).eq('current_section',selSection).order('name');
    const studIds=(studs||[]).map(s=>s.id);
    const{data:mdata}=await supabase.from('exam_marks').select('*').eq('exam_id',selExam).in('student_id',studIds);
    const examInfo=exams.find(e=>e.id===selExam);

    const rows=(studs||[]).map(s=>{
      const subjectMap={};
      let totalObt=0,totalMax=0;
      SUBJECTS.forEach(sub=>{
        const m=(mdata||[]).find(x=>x.student_id===s.id&&x.subject===sub);
        if(m){
          subjectMap[sub]={obt:m.obtained_marks,total:m.total_marks,absent:m.is_absent};
          if(!m.is_absent&&m.obtained_marks!==null){totalObt+=parseFloat(m.obtained_marks);totalMax+=m.total_marks;}
          else if(!m.is_absent)totalMax+=m.total_marks;
        } else subjectMap[sub]=null;
      });
      const pct=totalMax>0?parseFloat((totalObt/totalMax*100).toFixed(2)):null;
      return{...s,subjectMap,totalObt,totalMax,pct,grade:grade(pct),classTotal:studs.length,examName:examInfo?.name||''};
    });

    // Positions
    const sorted=[...rows].filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct);
    let pos=1;
    sorted.forEach((r,i)=>{
      r.position=i>0&&r.pct===sorted[i-1].pct?sorted[i-1].position:pos;pos++;
    });
    setResults(rows);setLoadingRes(false);
  }

  function openCard(s){
    const top3=[...results].filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct).slice(0,3);
    const w=window.open('','_blank');
    w.document.write(buildCard(s,s.examName,top3));
    w.document.close();setTimeout(()=>w.print(),800);
  }
  function printAll(){
    if(!results.length)return;
    const top3=[...results].filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct).slice(0,3);
    const html=results.map(s=>buildCard(s,s.examName,top3)).join('<div style="page-break-after:always"></div>');
    const w=window.open('','_blank');
    w.document.write(`<html><body>${html}</body></html>`);
    w.document.close();setTimeout(()=>w.print(),1000);
  }

  const passed=results.filter(r=>r.pct!==null&&r.pct>=40).length;
  const failed=results.filter(r=>r.pct!==null&&r.pct<40).length;
  const avgPct=results.filter(r=>r.pct!==null).length>0?(results.filter(r=>r.pct!==null).reduce((s,r)=>s+(r.pct||0),0)/results.filter(r=>r.pct!==null).length).toFixed(1):'—';
  const filtT=teachers.filter(t=>t.class===fClass&&t.section===fSec);

  return(
    <div style={{minHeight:'100vh',background:navy,fontFamily:'Georgia,serif'}}>
      <div style={{height:3,background:gold}}/>
      <div style={{background:navyMid,borderBottom:`1px solid ${border}`,padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.75rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.85rem'}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:gold,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
            <img src="/logo.png" alt="" style={{width:32,height:32,objectFit:'contain'}}/>
          </div>
          <div>
            <h1 style={{margin:0,fontSize:'1.1rem',fontWeight:700,color:cream}}>Examination Portal</h1>
            <p style={{margin:0,fontSize:'0.75rem',color:textSec}}>COE Sialkot — Admin</p>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          {[['exams','Exams'],['results','Results'],['logins','Teacher Logins']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:'0.5rem 1.1rem',borderRadius:8,border:`1px solid ${t===tab?gold:border}`,background:t===tab?gold:navyDeep,color:t===tab?navy:textSec,fontWeight:t===tab?700:400,cursor:'pointer',fontSize:'0.82rem'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'2rem 1.5rem'}}>
        {msg&&<div style={{background:msg.startsWith('❌')?'#2d0e0e':greenBg,border:`1px solid ${msg.startsWith('❌')?'#f09595':greenTx}`,borderRadius:8,padding:'0.9rem 1.2rem',marginBottom:'1.5rem',color:msg.startsWith('❌')?'#f09595':greenTx,fontSize:'0.9rem',display:'flex',justifyContent:'space-between'}}>
          <span>{msg}</span><button onClick={()=>setMsg('')} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button>
        </div>}

        {/* EXAMS TAB */}
        {tab==='exams'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h2 style={{margin:0,color:cream,fontSize:'1.05rem'}}>Manage Exams</h2>
              <button onClick={()=>setShowForm(!showForm)} style={{background:gold,color:navy,border:'none',borderRadius:8,padding:'0.6rem 1.4rem',fontWeight:700,cursor:'pointer',fontSize:'0.88rem'}}>
                {showForm?'✕ Cancel':'+ New Exam'}
              </button>
            </div>
            {showForm&&(
              <div style={{background:navyMid,border:`1px solid ${border}`,borderRadius:12,padding:'1.75rem',marginBottom:'1.5rem'}}>
                <h3 style={{margin:'0 0 1.25rem',color:cream,fontSize:'1rem'}}>Create New Exam</h3>
                <form onSubmit={createExam}>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'1rem',marginBottom:'1.25rem'}}>
                    <div>
                      <label style={{display:'block',color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Exam Name *</label>
                      <input required style={{...INP,width:'100%',boxSizing:'border-box'}} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Monthly Test 1 — 2025-26"/>
                    </div>
                    <div>
                      <label style={{display:'block',color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Exam Type *</label>
                      <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={form.exam_type} onChange={e=>setForm({...form,exam_type:e.target.value})}>
                        {EXAM_TYPES.map(et=><option key={et.value} value={et.value}>{et.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Class *</label>
                      <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={form.class} onChange={e=>setForm({...form,class:e.target.value})}>
                        {CLASSES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={creating} style={{background:gold,color:navy,border:'none',borderRadius:8,padding:'0.7rem 2rem',fontWeight:700,cursor:'pointer',opacity:creating?0.7:1}}>
                    {creating?'Creating…':'Create Exam →'}
                  </button>
                </form>
              </div>
            )}
            {loading?<p style={{color:textSec}}>Loading…</p>:(
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {exams.map(ex=>(
                  <div key={ex.id} style={{background:navyMid,border:`1px solid ${border}`,borderRadius:10,padding:'1.1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.75rem'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.25rem'}}>
                        <span style={{color:cream,fontWeight:600,fontSize:'0.95rem'}}>{ex.name}</span>
                        <span style={{background:ex.is_active?greenBg:'#2d0e0e',color:ex.is_active?greenTx:'#f09595',padding:'2px 8px',borderRadius:12,fontSize:'0.7rem',fontWeight:600}}>{ex.is_active?'Active':'Closed'}</span>
                      </div>
                      <div style={{color:textSec,fontSize:'0.8rem'}}>{EXAM_TYPES.find(t=>t.value===ex.exam_type)?.label} · Class {ex.class} · {ex.academic_year}</div>
                    </div>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      <button onClick={()=>toggleExam(ex)} style={{background:ex.is_active?'#3d2808':greenBg,color:ex.is_active?'#f0b060':greenTx,border:'none',borderRadius:6,padding:'0.4rem 0.9rem',cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>{ex.is_active?'Close':'Reopen'}</button>
                      <button onClick={()=>deleteExam(ex.id)} style={{background:'#2d0e0e',color:'#f09595',border:'none',borderRadius:6,padding:'0.4rem 0.9rem',cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>Delete</button>
                    </div>
                  </div>
                ))}
                {exams.length===0&&<div style={{textAlign:'center',padding:'3rem',color:textSec,background:navyMid,borderRadius:12,border:`1px solid ${border}`}}>No exams yet.</div>}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {tab==='results'&&(
          <div>
            <h2 style={{margin:'0 0 1.5rem',color:cream,fontSize:'1.05rem'}}>Class Result Sheet</h2>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:'1rem',marginBottom:'1.5rem',alignItems:'end'}}>
              <div>
                <label style={{display:'block',color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Examination</label>
                <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={selExam} onChange={e=>setSelExam(e.target.value)}>
                  <option value="">Select Exam</option>
                  {exams.filter(ex=>ex.class===selClass).map(ex=><option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Class</label>
                <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={selClass} onChange={e=>{setSelClass(e.target.value);setSelExam('');setResults([]);}}>
                  {CLASSES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Section</label>
                <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={selSection} onChange={e=>{setSelSection(e.target.value);setResults([]);}}>
                  {SECTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={loadResults} disabled={!selExam||loadingRes}
                style={{background:gold,color:navy,border:'none',borderRadius:8,padding:'0.65rem 1.5rem',fontWeight:700,cursor:'pointer',fontSize:'0.88rem',opacity:(!selExam||loadingRes)?0.6:1,whiteSpace:'nowrap'}}>
                {loadingRes?'Loading…':'Load Results'}
              </button>
            </div>

            {results.length>0&&(
              <>
                {/* Summary cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.25rem'}}>
                  {[['Students',results.length,cream],['Passed',passed,greenTx],['Failed',failed,'#f09595'],['Class Avg',avgPct+'%',goldLt]].map(([l,v,c])=>(
                    <div key={l} style={{background:navyMid,border:`1px solid ${border}`,borderRadius:10,padding:'1rem',textAlign:'center'}}>
                      <div style={{color:c,fontSize:'1.8rem',fontWeight:700}}>{v}</div>
                      <div style={{color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:'0.25rem'}}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Grade distribution */}
                <div style={{background:navyMid,border:`1px solid ${border}`,borderRadius:10,padding:'0.9rem 1.25rem',marginBottom:'1.25rem',display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{color:textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px'}}>Grade Distribution:</span>
                  {['A+','A','B','C','D','E','F'].map(g=>{
                    const cnt=results.filter(r=>r.grade===g).length;
                    return cnt>0?<span key={g} style={{background:navyDeep,border:`1px solid ${gc(g)}`,color:gc(g),padding:'3px 10px',borderRadius:12,fontSize:'0.75rem',fontWeight:600}}>{g}: {cnt}</span>:null;
                  })}
                </div>

                {/* Buttons */}
                <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                  <button onClick={()=>window.print()} style={{background:navyMid,color:'#c0d8f8',border:`1px solid ${border}`,borderRadius:8,padding:'0.55rem 1.2rem',cursor:'pointer',fontSize:'0.82rem',fontWeight:600}}>🖨️ Print Result Sheet</button>
                  <button onClick={printAll} style={{background:gold,color:navy,border:'none',borderRadius:8,padding:'0.55rem 1.2rem',cursor:'pointer',fontSize:'0.82rem',fontWeight:700}}>📋 Print All Result Cards ({results.length})</button>
                </div>

                {/* Result table */}
                <div style={{background:navyMid,border:`1px solid ${border}`,borderRadius:12,overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:1200}}>
                    <thead>
                      <tr>
                        <th style={{...TH,textAlign:'left'}}>Pos</th>
                        <th style={{...TH,textAlign:'left'}}>Roll No</th>
                        <th style={{...TH,textAlign:'left',minWidth:130}}>Name</th>
                        <th style={{...TH,textAlign:'left',minWidth:120}}>Father</th>
                        {SUBJECTS.map(s=>(
                          <th key={s} style={TH}>
                            <div style={{fontSize:'0.6rem'}}>{SDISPLAY[s].split(' ')[0]}</div>
                            <div style={{fontSize:'0.52rem',opacity:0.6}}>Ob/Mx/%/Gr</div>
                          </th>
                        ))}
                        <th style={TH}>Total<br/><span style={{fontSize:'0.55rem'}}>Obt/Max</span></th>
                        <th style={TH}>%</th>
                        <th style={TH}>Gr</th>
                        <th style={TH}>Card</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...results].sort((a,b)=>(b.pct||0)-(a.pct||0)).map((r,i)=>(
                        <tr key={r.id} style={{background:i%2===0?navyMid:navyDeep}}>
                          <td style={{...TD,textAlign:'left',color:r.position<=3?goldLt:textMut,fontWeight:r.position<=3?700:400}}>{r.position||'—'}</td>
                          <td style={{...TD,textAlign:'left'}}><code style={{background:navyDeep,padding:'1px 4px',borderRadius:3,color:goldLt,fontSize:'0.7rem'}}>{r.roll_no}</code></td>
                          <td style={{...TD,textAlign:'left',color:cream,fontWeight:500,fontSize:'0.78rem'}}>{r.name}</td>
                          <td style={{...TD,textAlign:'left',color:textSec,fontSize:'0.72rem'}}>{r.father_name||'—'}</td>
                          {SUBJECTS.map(sub=>{
                            const m=r.subjectMap[sub];
                            if(!m) return <td key={sub} style={{...TD,color:textMut}}>—</td>;
                            const p=m.absent?null:m.total>0?Math.round(m.obt/m.total*100):null;
                            const g=m.absent?'Ab':grade(p);
                            return(
                              <td key={sub} style={{...TD,fontSize:'0.65rem',padding:'0.3rem 0.4rem'}}>
                                {m.absent
                                  ?<span style={{color:textMut}}>Ab</span>
                                  :m.obt!==null
                                  ?<span>
                                    <span style={{color:cream,fontWeight:600}}>{m.obt}</span>
                                    <span style={{color:textMut}}>/{m.total}</span>
                                    <br/>
                                    <span style={{color:textMut}}>{p}%/</span>
                                    <span style={{color:gc(g),fontWeight:700}}>{g}</span>
                                   </span>
                                  :<span style={{color:textMut}}>—</span>
                                }
                              </td>
                            );
                          })}
                          <td style={{...TD,color:cream,fontWeight:600,fontSize:'0.75rem'}}>{r.totalObt}/{r.totalMax}</td>
                          <td style={{...TD,color:r.pct!==null?cream:textMut,fontWeight:700}}>{r.pct!==null?r.pct+'%':'—'}</td>
                          <td style={{...TD,color:gc(r.grade),fontWeight:700,fontSize:'0.85rem'}}>{r.grade}</td>
                          <td style={{...TD}}>
                            <button onClick={()=>openCard(r)} style={{background:gold,color:navy,border:'none',borderRadius:4,padding:'3px 7px',cursor:'pointer',fontSize:'0.65rem',fontWeight:700}}>
                              🖨️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* LOGINS TAB */}
        {tab==='logins'&&(
          <div>
            <h2 style={{margin:'0 0 1.5rem',color:cream,fontSize:'1.05rem'}}>Teacher Login Credentials</h2>
            <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
              <select style={INP} value={fClass} onChange={e=>setFClass(e.target.value)}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>
              <select style={INP} value={fSec} onChange={e=>setFSec(e.target.value)}>{SECTIONS.map(s=><option key={s}>{s}</option>)}</select>
            </div>
            <div style={{background:navyMid,border:`1px solid ${border}`,borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Subject','Login ID','Password'].map(h=><th key={h} style={{...TH,textAlign:'left'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtT.map((t,i)=>(
                    <tr key={t.id} style={{background:i%2===0?navyMid:navyDeep}}>
                      <td style={{...TD,textAlign:'left',color:goldLt,fontWeight:500}}>{t.subject_display}</td>
                      <td style={{...TD,textAlign:'left'}}><code style={{color:cream,fontSize:'0.82rem'}}>{t.login}</code></td>
                      <td style={{...TD,textAlign:'left'}}><code style={{color:textSec,fontSize:'0.82rem'}}>{t.password}</code></td>
                    </tr>
                  ))}
                  {filtT.length===0&&<tr><td colSpan={3} style={{padding:'2rem',textAlign:'center',color:textSec}}>No teachers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div style={{height:3,background:gold}}/>
      <style>{`@media print{button{display:none!important}}`}</style>
    </div>
  );
}

export default function AdminExams(){
  return <AdminAuth><AdminExamsInner/></AdminAuth>;
}
