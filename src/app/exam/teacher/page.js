// src/app/exam/teacher/page.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const W = {
  bg:'#f8f9fa', card:'#ffffff', navy:'#0E1F3D', gold:'#C9922A', goldLt:'#E8B84B',
  text:'#1a1a2e', textSec:'#4b5563', textMut:'#9ca3af',
  border:'#e5e7eb', borderMd:'#d1d5db',
  greenTx:'#16a34a', greenBg:'#f0fdf4', greenBd:'#86efac',
  redTx:'#dc2626',   redBg:'#fef2f2',   redBd:'#fca5a5',
  amber:'#d97706',   amberBg:'#fffbeb', amberBd:'#fcd34d',
};

function getGrade(pct) {
  if(pct===null||pct===undefined)return '—';
  if(pct>=90)return 'A+'; if(pct>=80)return 'A'; if(pct>=70)return 'B';
  if(pct>=60)return 'C';  if(pct>=50)return 'D'; if(pct>=40)return 'E';
  return 'F';
}
function gradeColor(g){
  return{'A+':'#16a34a','A':'#15803d','B':'#ca8a04','C':'#d97706','D':'#dc2626','E':'#991b1b','F':'#7f1d1d','Ab':'#9ca3af','—':'#9ca3af'}[g]||'#9ca3af';
}

function TeacherLogin({onLogin}){
  const [login,setLogin]=useState('');
  const [pass,setPass]=useState('');
  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);

  async function submit(e){
    e.preventDefault(); setLoading(true); setErr('');
    const{data,error}=await supabase.from('exam_teachers').select('*').eq('login',login.trim()).eq('password',pass.trim()).single();
    if(error||!data) setErr('Invalid login or password.');
    else onLogin(data);
    setLoading(false);
  }

  const F={width:'100%',padding:'0.75rem 1rem',background:W.bg,border:`1.5px solid ${W.borderMd}`,borderRadius:8,color:W.text,fontSize:'0.95rem',boxSizing:'border-box',fontFamily:'Georgia,serif'};

  return(
    <div style={{minHeight:'100vh',background:W.bg,display:'flex',flexDirection:'column',fontFamily:'Georgia,serif'}}>
      <div style={{height:5,background:`linear-gradient(90deg,${W.navy},${W.gold})`}}/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
        <div style={{width:'100%',maxWidth:420}}>
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:W.gold,border:`3px solid ${W.goldLt}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',overflow:'hidden',boxShadow:'0 4px 16px rgba(201,146,42,0.3)'}}>
              <img src="/logo.png" alt="" style={{width:72,height:72,objectFit:'contain'}}/>
            </div>
            <h1 style={{color:W.navy,margin:'0 0 0.25rem',fontSize:'1.5rem',fontWeight:700}}>COE Sialkot</h1>
            <p style={{color:W.textSec,margin:0,fontSize:'0.82rem',textTransform:'uppercase',letterSpacing:'0.8px'}}>Teacher Examination Portal</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1.75rem'}}>
            <div style={{flex:1,height:1,background:W.gold}}/><span style={{color:W.gold}}>⚜</span><div style={{flex:1,height:1,background:W.gold}}/>
          </div>
          <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:'2rem',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
            <h2 style={{color:W.navy,margin:'0 0 1.5rem',fontSize:'0.88rem',textTransform:'uppercase',letterSpacing:'1px',textAlign:'center',fontWeight:700}}>Teacher Login</h2>
            <form onSubmit={submit}>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Login ID</label>
                <input required value={login} onChange={e=>setLogin(e.target.value)} style={F} placeholder="coeskt@6jinnahenglish"/>
              </div>
              <div style={{marginBottom:'1.5rem'}}>
                <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Password</label>
                <input required type="password" value={pass} onChange={e=>setPass(e.target.value)} style={F} placeholder="••••••••"/>
              </div>
              {err&&<div style={{background:W.redBg,border:`1px solid ${W.redBd}`,color:W.redTx,padding:'0.7rem',borderRadius:8,marginBottom:'1rem',fontSize:'0.85rem',textAlign:'center'}}>{err}</div>}
              <button type="submit" disabled={loading} style={{width:'100%',padding:'0.9rem',background:W.navy,color:'#fff',border:'none',borderRadius:10,fontSize:'1rem',fontWeight:700,cursor:'pointer',opacity:loading?0.7:1,fontFamily:'Georgia,serif'}}>
                {loading?'Signing in…':'Sign In →'}
              </button>
            </form>
          </div>
          <p style={{color:W.textMut,fontSize:'0.72rem',textAlign:'center',marginTop:'1.5rem',textTransform:'uppercase',letterSpacing:'0.5px'}}>Punjab Daanish Schools & COE Authority</p>
        </div>
      </div>
      <div style={{height:5,background:`linear-gradient(90deg,${W.gold},${W.navy})`}}/>
    </div>
  );
}

function MarksEntry({teacher}){
  const [exams,setExams]=useState([]);
  const [selExam,setSelExam]=useState(null);
  const [students,setStudents]=useState([]);
  const [marks,setMarks]=useState({});
  const [totalMarks,setTotalMarks]=useState(100);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(false);
  const [lockStatus,setLockStatus]=useState(null);
  const [locking,setLocking]=useState(false);

  useEffect(()=>{loadExams();loadStudents();},[]);
  useEffect(()=>{if(selExam){loadExistingMarks();loadLockStatus();}},[selExam]);

  async function loadExams(){
    const{data}=await supabase.from('exams').select('*').eq('class',teacher.class).eq('is_active',true).order('created_at',{ascending:false});
    setExams(data||[]);
    if(data?.length>0)setSelExam(data[0]);
  }
  async function loadStudents(){
    const{data}=await supabase.from('students').select('id,name,roll_no').eq('current_class',teacher.class).eq('current_section',teacher.section).order('roll_no');
    setStudents(data||[]);
  }
  async function loadLockStatus(){
    if(!selExam)return;
    const{data}=await supabase.from('exam_section_locks').select('*').eq('exam_id',selExam.id).eq('class',teacher.class).eq('section',teacher.section).eq('subject',teacher.subject).single();
    setLockStatus(data||{locked:false});
  }
  async function loadExistingMarks(){
    if(!selExam)return;
    setLoading(true);
    let studs=students;
    if(!studs.length){
      const{data}=await supabase.from('students').select('id').eq('current_class',teacher.class).eq('current_section',teacher.section);
      studs=data||[];
    }
    const studIds=studs.map(s=>s.id);
    const{data}=await supabase.from('exam_marks').select('*').eq('exam_id',selExam.id).eq('subject',teacher.subject).in('student_id',studIds);
    if(data?.length>0){
      const m={};
      data.forEach(r=>{m[r.student_id]={obtained:r.obtained_marks??'',absent:r.is_absent};});
      setMarks(m);setTotalMarks(data[0].total_marks||100);
    } else {setMarks({});setTotalMarks(100);}
    setLoading(false);
  }

  async function saveMarks(){
    if(!selExam||lockStatus?.locked)return;
    setSaving(true);setSaved(false);
    const rows=students.map(s=>({
      exam_id:selExam.id,student_id:s.id,teacher_id:teacher.id,subject:teacher.subject,
      total_marks:totalMarks,
      obtained_marks:marks[s.id]?.absent?null:(parseFloat(marks[s.id]?.obtained)||null),
      is_absent:marks[s.id]?.absent||false,locked:false,
    }));
    const{error}=await supabase.from('exam_marks').upsert(rows,{onConflict:'exam_id,student_id,subject'});
    if(!error)setSaved(true);
    setSaving(false);
  }

  async function saveAndLock(){
    if(!selExam||lockStatus?.locked)return;
    if(!confirm('Save and lock marks?\n\nAfter locking, only the admin can make changes.'))return;
    setLocking(true);
    const rows=students.map(s=>({
      exam_id:selExam.id,student_id:s.id,teacher_id:teacher.id,subject:teacher.subject,
      total_marks:totalMarks,
      obtained_marks:marks[s.id]?.absent?null:(parseFloat(marks[s.id]?.obtained)||null),
      is_absent:marks[s.id]?.absent||false,locked:true,
    }));
    await supabase.from('exam_marks').upsert(rows,{onConflict:'exam_id,student_id,subject'});
    await supabase.from('exam_section_locks').upsert({
      exam_id:selExam.id,class:teacher.class,section:teacher.section,subject:teacher.subject,
      locked:true,locked_at:new Date().toISOString(),locked_by:teacher.login,
    },{onConflict:'exam_id,class,section,subject'});
    await loadLockStatus();
    setSaved(true);setLocking(false);
  }

  const isLocked=lockStatus?.locked===true;
  const enteredCount=students.filter(s=>marks[s.id]?.absent||(marks[s.id]?.obtained!==''&&marks[s.id]?.obtained!==undefined)).length;
  const allEntered=enteredCount===students.length&&students.length>0;

  const TH={padding:'0.6rem 0.8rem',background:W.navy,color:'#fff',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center',borderBottom:`2px solid ${W.gold}`,whiteSpace:'nowrap'};
  const TD={padding:'0.5rem 0.8rem',fontSize:'0.85rem',textAlign:'center',borderBottom:`1px solid ${W.border}`,color:W.text};

  return(
    <div style={{minHeight:'100vh',background:W.bg,fontFamily:'Georgia,serif'}}>
      <div style={{height:4,background:`linear-gradient(90deg,${W.navy},${W.gold})`}}/>
      <div style={{background:W.card,borderBottom:`1px solid ${W.border}`,padding:'0.9rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.85rem'}}>
          <div style={{width:38,height:38,borderRadius:'50%',background:W.gold,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
            <img src="/logo.png" alt="" style={{width:34,height:34,objectFit:'contain'}}/>
          </div>
          <div>
            <div style={{color:W.navy,fontSize:'1rem',fontWeight:700}}>{teacher.subject_display} — {teacher.class} {teacher.section}</div>
            <div style={{color:W.textSec,fontSize:'0.75rem'}}>{teacher.login}</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          {isLocked&&<span style={{background:W.redBg,color:W.redTx,border:`1px solid ${W.redBd}`,borderRadius:6,padding:'0.3rem 0.85rem',fontSize:'0.75rem',fontWeight:700}}>🔒 Locked</span>}
          <button onClick={()=>{sessionStorage.removeItem('coe_teacher');window.location.reload();}}
            style={{background:W.redBg,color:W.redTx,border:`1px solid ${W.redBd}`,borderRadius:6,padding:'0.4rem 1rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'2rem 1.5rem'}}>
        {isLocked&&(
          <div style={{background:W.redBg,border:`1px solid ${W.redBd}`,borderRadius:10,padding:'1rem 1.5rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'1rem'}}>
            <span style={{fontSize:'1.5rem'}}>🔒</span>
            <div>
              <div style={{color:W.redTx,fontWeight:700,fontSize:'0.95rem'}}>Marks are locked</div>
              <div style={{color:W.redTx,fontSize:'0.82rem',opacity:0.8}}>
                Locked on {lockStatus?.locked_at?new Date(lockStatus.locked_at).toLocaleString():'—'}. Contact admin to make changes.
              </div>
            </div>
          </div>
        )}

        <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:'1.5rem',marginBottom:'1.5rem',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',display:'grid',gridTemplateColumns:'1fr 200px',gap:'1.5rem',alignItems:'end'}}>
          <div>
            <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.4rem',fontWeight:600}}>Examination</label>
            {exams.length===0
              ?<div style={{color:W.textMut,padding:'0.75rem',background:W.amberBg,border:`1px solid ${W.amberBd}`,borderRadius:6,fontSize:'0.85rem'}}>No active exams. Ask admin to create one.</div>
              :<select value={selExam?.id||''} onChange={e=>setSelExam(exams.find(x=>x.id===e.target.value))} disabled={isLocked}
                  style={{width:'100%',padding:'0.7rem 1rem',background:W.bg,border:`1.5px solid ${W.borderMd}`,borderRadius:8,color:W.text,fontSize:'0.92rem',fontFamily:'Georgia,serif'}}>
                  {exams.map(ex=><option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
            }
          </div>
          <div>
            <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.4rem',fontWeight:600}}>Total Marks</label>
            <input type="number" min={1} max={200} value={totalMarks} disabled={isLocked}
              onChange={e=>{setTotalMarks(parseInt(e.target.value)||100);setSaved(false);}}
              style={{width:'100%',padding:'0.7rem 1rem',background:isLocked?'#f3f4f6':W.bg,border:`2px solid ${W.gold}`,borderRadius:8,color:W.navy,fontSize:'1.4rem',fontWeight:700,textAlign:'center',boxSizing:'border-box',fontFamily:'Georgia,serif'}}/>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.75rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <span style={{color:W.textSec,fontSize:'0.85rem'}}>
              <span style={{color:W.navy,fontWeight:700,fontSize:'1.1rem'}}>{enteredCount}</span> / <span style={{color:W.navy,fontWeight:700}}>{students.length}</span> students entered
            </span>
            <div style={{width:160,height:6,background:W.border,borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${students.length>0?enteredCount/students.length*100:0}%`,background:allEntered?W.greenTx:W.gold,borderRadius:3,transition:'width 0.3s'}}/>
            </div>
            {saved&&!isLocked&&<span style={{color:W.greenTx,fontSize:'0.82rem',fontWeight:600}}>✓ Saved</span>}
          </div>
          {!isLocked&&(
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={saveMarks} disabled={saving||!selExam}
                style={{background:W.navy,color:'#fff',border:'none',borderRadius:8,padding:'0.6rem 1.4rem',fontWeight:600,cursor:'pointer',fontSize:'0.85rem',opacity:saving?0.7:1}}>
                {saving?'Saving…':'💾 Save Draft'}
              </button>
              <button onClick={saveAndLock} disabled={locking||!selExam||enteredCount===0}
                style={{background:allEntered?W.greenTx:W.amber,color:'#fff',border:'none',borderRadius:8,padding:'0.6rem 1.4rem',fontWeight:700,cursor:'pointer',fontSize:'0.85rem',opacity:locking?0.7:1}}>
                {locking?'Locking…':'🔒 Save & Lock'}
              </button>
            </div>
          )}
        </div>

        <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['#','Roll No','Student Name',`Obtained / ${totalMarks}`,'%','Grade','Absent'].map(h=>(
                  <th key={h} style={{...TH,textAlign:h==='Student Name'?'left':'center'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ?<tr><td colSpan={7} style={{padding:'3rem',textAlign:'center',color:W.textMut}}>Loading…</td></tr>
                :students.map((s,i)=>{
                  const ob=marks[s.id]?.obtained;
                  const absent=marks[s.id]?.absent;
                  const pct=(!absent&&ob!==''&&ob!==undefined)?Math.round((parseFloat(ob)/totalMarks)*100):null;
                  const g=absent?'Ab':getGrade(pct);
                  return(
                    <tr key={s.id} style={{background:i%2===0?'#fff':'#f9fafb',opacity:absent?0.6:1}}>
                      <td style={{...TD,color:W.textMut,fontSize:'0.78rem'}}>{i+1}</td>
                      <td style={{...TD}}><code style={{background:'#f3f4f6',padding:'2px 6px',borderRadius:4,color:W.navy,fontSize:'0.78rem',fontWeight:600}}>{s.roll_no}</code></td>
                      <td style={{...TD,textAlign:'left',fontWeight:500,color:absent?W.textMut:W.text,textDecoration:absent?'line-through':'none'}}>{s.name}</td>
                      <td style={{...TD}}>
                        {!absent&&!isLocked&&(
                          <input type="number" min={0} max={totalMarks} value={ob??''}
                            onChange={e=>{setMarks(p=>({...p,[s.id]:{...p[s.id],obtained:e.target.value,absent:false}}));setSaved(false);}}
                            style={{width:85,padding:'0.4rem 0.5rem',background:W.bg,border:`1.5px solid ${ob!==''&&ob!==undefined?W.navy:W.borderMd}`,borderRadius:6,color:W.text,fontSize:'0.9rem',textAlign:'center',fontFamily:'Georgia,serif'}}
                            placeholder="—"/>
                        )}
                        {!absent&&isLocked&&<span style={{color:W.text,fontWeight:600}}>{ob??'—'}</span>}
                      </td>
                      <td style={{...TD,fontWeight:600,color:pct!==null?W.navy:W.textMut}}>{absent?'—':pct!==null?`${pct}%`:'—'}</td>
                      <td style={{...TD,fontWeight:700,fontSize:'0.95rem',color:gradeColor(g)}}>{g}</td>
                      <td style={{...TD}}>
                        {!isLocked
                          ?<input type="checkbox" checked={absent||false}
                              onChange={()=>{setMarks(p=>({...p,[s.id]:{obtained:'',absent:!p[s.id]?.absent}}));setSaved(false);}}
                              style={{accentColor:W.redTx,cursor:'pointer',width:16,height:16}}/>
                          :absent?<span style={{color:W.redTx,fontWeight:600,fontSize:'0.8rem'}}>Ab</span>:null
                        }
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {!isLocked&&(
          <div style={{marginTop:'1.5rem',display:'flex',justifyContent:'flex-end',gap:'1rem',alignItems:'center'}}>
            {saved&&<span style={{color:W.greenTx,fontSize:'0.85rem',fontWeight:600}}>✓ Changes saved</span>}
            <button onClick={saveMarks} disabled={saving||!selExam}
              style={{background:W.navy,color:'#fff',border:'none',borderRadius:8,padding:'0.8rem 2rem',fontWeight:600,cursor:'pointer',fontSize:'0.9rem',opacity:saving?0.7:1}}>
              {saving?'Saving…':'💾 Save Draft'}
            </button>
            <button onClick={saveAndLock} disabled={locking||!selExam||enteredCount===0}
              style={{background:allEntered?W.greenTx:W.amber,color:'#fff',border:'none',borderRadius:8,padding:'0.8rem 2rem',fontWeight:700,cursor:'pointer',fontSize:'0.9rem',opacity:locking?0.7:1}}>
              {locking?'Locking…':`🔒 Save & Lock (${enteredCount}/${students.length})`}
            </button>
          </div>
        )}

        <div style={{marginTop:'2rem',background:W.card,border:`1px solid ${W.border}`,borderRadius:10,padding:'1rem 1.5rem',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
          <div style={{color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.75rem',fontWeight:600}}>Grading Criteria</div>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {[['A+','≥90%','#16a34a'],['A','≥80%','#15803d'],['B','≥70%','#ca8a04'],['C','≥60%','#d97706'],['D','≥50%','#dc2626'],['E','≥40%','#991b1b'],['F','<40%','#7f1d1d']].map(([g,r,c])=>(
              <div key={g} style={{background:`${c}15`,border:`1px solid ${c}`,borderRadius:6,padding:'0.35rem 0.75rem',fontSize:'0.78rem',color:c}}>
                <strong>{g}</strong> {r}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{height:4,background:`linear-gradient(90deg,${W.gold},${W.navy})`,marginTop:'2rem'}}/>
    </div>
  );
}

export default function TeacherPortal(){
  const [teacher,setTeacher]=useState(null);
  const [checked,setChecked]=useState(false);
  useEffect(()=>{
    const saved=sessionStorage.getItem('coe_teacher');
    if(saved)setTeacher(JSON.parse(saved));
    setChecked(true);
  },[]);
  function handleLogin(t){sessionStorage.setItem('coe_teacher',JSON.stringify(t));setTeacher(t);}
  if(!checked)return null;
  if(!teacher)return <TeacherLogin onLogin={handleLogin}/>;
  return <MarksEntry teacher={teacher}/>;
}
