// src/app/admin/exams/page.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminAuth from '@/components/AdminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const W = {
  bg:'#f8f9fa', card:'#ffffff', navy:'#0E1F3D', navyMid:'#1a3060',
  gold:'#C9922A', goldLt:'#E8B84B', blue:'#1d4ed8',
  text:'#1a1a2e', textSec:'#4b5563', textMut:'#9ca3af',
  border:'#e5e7eb', borderMd:'#d1d5db',
  greenTx:'#16a34a', greenBg:'#f0fdf4', greenBd:'#86efac',
  redTx:'#dc2626',   redBg:'#fef2f2',   redBd:'#fca5a5',
  amber:'#d97706',
};

const CLASSES  = ['6th','7th','8th'];
const SECTIONS = ['Jinnah','Iqbal','Sir Syed','Liaqat','Tipu','Babar','Abdali'];
const SUBJECTS = ['English','Mathematics','Urdu','Science','Islamiyat','Tarjuma','SST','Geography','Computer','FineArts'];
const SDISPLAY = {
  English:'English', Mathematics:'Mathematics', Urdu:'Urdu', Science:'Science',
  Islamiyat:'Islamiyat', Tarjuma:"Tarjuma Tul Qur'an", SST:'SST / History',
  Geography:'Geography', Computer:'Computer Science', FineArts:'Fine Arts',
};
const EXAM_TYPES = [
  {value:'monthly_1',label:'Monthly Test 1'},{value:'monthly_2',label:'Monthly Test 2'},
  {value:'monthly_3',label:'Monthly Test 3'},{value:'first_term',label:'First Term'},
  {value:'mid_term',label:'Mid Term'},{value:'final_term',label:'Final Term'},
];
const REMARKS = {'A+':'Outstanding','A':'Excellent','B':'Very Good','C':'Good','D':'Satisfactory','E':'Needs Improvement','F':'Fail','Ab':'Absent'};

function getGrade(pct) {
  if(pct===null||pct===undefined)return '—';
  if(pct>=90)return 'A+'; if(pct>=80)return 'A'; if(pct>=70)return 'B';
  if(pct>=60)return 'C';  if(pct>=50)return 'D'; if(pct>=40)return 'E';
  return 'F';
}
function gc(g){
  return{'A+':'#16a34a','A':'#15803d','B':'#ca8a04','C':'#d97706','D':'#dc2626','E':'#991b1b','F':'#7f1d1d','Ab':'#6b7280','—':'#9ca3af'}[g]||'#9ca3af';
}

// ── Single-page result card ───────────────────────────────────
function buildCard(s, examName, top3) {
  const subRows = SUBJECTS.map((sub,i)=>{
    const m=s.subjectMap[sub];
    if(!m)return '';
    const p=m.absent?null:m.total>0?Math.round(m.obt/m.total*100):null;
    const g=m.absent?'Ab':getGrade(p);
    const c={'A+':'#16a34a','A':'#15803d','B':'#ca8a04','C':'#d97706','D':'#dc2626','E':'#991b1b','F':'#7f1d1d','Ab':'#6b7280'}[g]||'#333';
    return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center;font-size:11px;color:#777">${i+1}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;font-size:12px;color:#1a1a2e;font-weight:500">${SDISPLAY[sub]}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center;font-size:12px">${m.total}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center;font-size:12px;font-weight:600">${m.absent?'Ab':m.obt??'—'}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center;font-size:12px">${m.absent||p===null?'—':p+'%'}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center;font-size:12px;font-weight:700;color:${c}">${g}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center;font-size:11px;color:${c}">${REMARKS[g]||'—'}</td>
    </tr>`;
  }).join('');

  const g   = getGrade(s.pct);
  const gc2 = {'A+':'#16a34a','A':'#15803d','B':'#ca8a04','C':'#d97706','D':'#dc2626','E':'#991b1b','F':'#7f1d1d'}[g]||'#333';
  const rmk = s.pct>=90?'Outstanding performance!':s.pct>=80?'Excellent work!':s.pct>=70?'Very good performance.':s.pct>=60?'Good effort.':s.pct>=50?'Satisfactory performance.':'Needs significant improvement.';

  const t3html = top3.slice(0,3).map((t,i)=>{
    const cols=['#1d4ed8','#0369a1','#0e7490'];
    const lbl=['1st','2nd','3rd'];
    return `<td style="border:1px solid #ddd;padding:6px;text-align:center;background:${cols[i]}12;width:33%">
      <div style="font-size:9px;color:${cols[i]};font-weight:700">${lbl[i]} Position</div>
      <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-top:2px">${t.name}</div>
      <div style="font-size:10px;font-weight:600;color:${cols[i]}">${t.pct}%</div>
    </td>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Result — ${s.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;background:#fff}
.page{width:190mm;height:267mm;background:#fff;margin:0 auto;padding:8mm 10mm;position:relative;overflow:hidden}
.band{height:4px;background:linear-gradient(90deg,#1d4ed8,#C9922A);border-radius:2px;margin-bottom:6px}
.band2{background:linear-gradient(90deg,#C9922A,#1d4ed8);margin-top:6px;margin-bottom:0}
.hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1d4ed8;padding-bottom:6px;margin-bottom:6px}
.logo{width:52px;height:52px;object-fit:contain}
.sc{text-align:center;flex:1}
.sc h1{font-size:19px;font-weight:900;color:#1a1a2e;letter-spacing:1px;text-transform:uppercase}
.sc h2{font-size:11px;color:#555;font-weight:normal;margin-top:1px}
.badge{background:linear-gradient(135deg,#1d4ed8,#0369a1);color:#fff;text-align:center;padding:5px;border-radius:4px;margin-bottom:6px}
.badge h3{font-size:13px;font-weight:700;letter-spacing:0.5px}
.badge p{font-size:10px;opacity:0.85;margin-top:1px}
.igrid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ddd;margin-bottom:6px}
.ic{padding:4px 8px;border:1px solid #ddd}
.ilbl{font-size:9px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.3px}
.ival{color:#1a1a2e;font-weight:600;font-size:12px}
.ival.hi{color:#1d4ed8;font-size:13px}
.stl{font-size:11px;font-weight:700;color:#1d4ed8;border-bottom:1.5px solid #1d4ed8;padding-bottom:2px;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.3px}
table{width:100%;border-collapse:collapse;margin-bottom:6px}
.th{background:#1d4ed8;color:#fff;padding:5px 6px;font-size:10px;border:1px solid #1565c0;text-align:center}
.tot td{background:#1d4ed8;color:#fff!important;font-weight:700;padding:5px 6px;font-size:11px;border:1px solid #1565c0}
.gbar{display:flex;gap:2px;margin-bottom:6px}
.gi{flex:1;text-align:center;padding:3px 1px;border-radius:2px;font-size:8px;font-weight:700;color:#fff}
.rmkbox{border:1px solid #ddd;border-radius:4px;padding:5px 8px;background:#f0fdf4;font-size:11px;color:#166534;margin-bottom:8px;min-height:22px}
.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:6px}
.sb{text-align:center}
.sl{border-top:1px solid #333;margin-bottom:3px;margin-top:20px}
.sn{font-weight:700;font-size:11px;color:#1a1a2e}
.sr{font-size:9px;color:#555;margin-top:1px}
.ft{text-align:center;margin-top:5px;font-size:8px;color:#aaa;font-style:italic;border-top:1px solid #eee;padding-top:4px}
@media print{body{background:#fff}.page{margin:0;box-shadow:none;page-break-after:always}}
</style></head><body>
<div class="page">
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
  <div class="ic"><div class="ilbl">Class & Section</div><div class="ival">${s.current_class} — ${s.current_section}</div></div>
  <div class="ic"><div class="ilbl">Examination</div><div class="ival">${examName}</div></div>
  <div class="ic"><div class="ilbl">Position in Class</div><div class="ival hi">${s.position||'—'} of ${s.classTotal||'—'}</div></div>
</div>
<div class="stl">Academic Performance</div>
<table><thead><tr>
  <th class="th">#</th><th class="th" style="text-align:left">Subject</th>
  <th class="th">Max</th><th class="th">Obt.</th><th class="th">%</th><th class="th">Grade</th><th class="th">Remarks</th>
</tr></thead><tbody>
${subRows}
<tr class="tot">
  <td colspan="2" style="text-align:left">GRAND TOTAL</td>
  <td>${s.totalMax}</td><td>${s.totalObt}</td>
  <td>${s.pct!==null?s.pct+'%':'—'}</td>
  <td style="color:${gc2}!important">${g}</td>
  <td>${REMARKS[g]||'—'}</td>
</tr></tbody></table>
<div class="stl">Grading Scale</div>
<div class="gbar">
  ${[['A+','≥90','#16a34a'],['A','≥80','#15803d'],['B','≥70','#ca8a04'],['C','≥60','#d97706'],['D','≥50','#dc2626'],['E','≥40','#991b1b'],['F','<40','#7f1d1d']].map(([g,r,c])=>`<div class="gi" style="background:${c}">${g} ${r}%</div>`).join('')}
</div>
${top3.length>0?`<div class="stl">Top Three Positions — ${s.current_class} ${s.current_section}</div><table><tr>${t3html}</tr></table>`:''}
<div class="stl">Teacher's Remarks</div>
<div class="rmkbox">${rmk} Grade: <strong style="color:${gc2}">${g}</strong></div>
<div class="sigs">
  <div class="sb"><div class="sl"></div><div class="sn">Class Teacher</div><div class="sr">Date: ___/___/2026</div></div>
  <div class="sb"><div class="sl"></div><div class="sn">Dr Naim Tahir Baig</div><div class="sr">Senior Coordinator</div></div>
  <div class="sb"><div class="sl"></div><div class="sn">Sir Shahbaz Hassan</div><div class="sr">Principal · School Stamp</div></div>
</div>
<div class="ft">Computer-generated document · Parent's signature required · COE Sialkot 2026</div>
<div class="band band2"></div>
</div></body></html>`;
}

const TH = {padding:'0.4rem 0.5rem',color:'#fff',fontSize:'0.62rem',textTransform:'uppercase',letterSpacing:'0.4px',background:W.navy,textAlign:'center',border:'1px solid #1a3060',whiteSpace:'nowrap'};
const TD = {padding:'0.4rem 0.5rem',fontSize:'0.75rem',textAlign:'center',border:`1px solid ${W.border}`,color:W.text};
const INP= {padding:'0.6rem 0.9rem',border:`1.5px solid ${W.borderMd}`,borderRadius:6,fontSize:'0.85rem',background:W.bg,color:W.text,fontFamily:'Georgia,serif'};

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
  const [locks,      setLocks]      = useState([]);
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
    const{data:lockData}=await supabase.from('exam_section_locks').select('*').eq('exam_id',selExam).eq('class',selClass).eq('section',selSection);
    setLocks(lockData||[]);
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
        }else subjectMap[sub]=null;
      });
      const pct=totalMax>0?parseFloat((totalObt/totalMax*100).toFixed(2)):null;
      return{...s,subjectMap,totalObt,totalMax,pct,grade:getGrade(pct),classTotal:studs.length,examName:examInfo?.name||''};
    });

    const sorted=[...rows].filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct);
    let pos=1;
    sorted.forEach((r,i)=>{r.position=i>0&&r.pct===sorted[i-1].pct?sorted[i-1].position:pos;pos++;});
    setResults(rows);setLoadingRes(false);
  }

  async function unlockSubject(subject){
    if(!confirm(`Unlock ${SDISPLAY[subject]} for admin editing?`))return;
    await supabase.from('exam_section_locks').update({locked:false,locked_at:null}).eq('exam_id',selExam).eq('class',selClass).eq('section',selSection).eq('subject',subject);
    await loadResults();
    setMsg(`✅ ${SDISPLAY[subject]} unlocked. Teacher can now edit.`);
  }
  async function unlockAll(){
    if(!confirm('Unlock ALL subjects for this section?'))return;
    await supabase.from('exam_section_locks').update({locked:false,locked_at:null}).eq('exam_id',selExam).eq('class',selClass).eq('section',selSection);
    await loadResults();
    setMsg('✅ All subjects unlocked for this section.');
  }

  function openCard(s){
    const top3=[...results].filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct).slice(0,3);
    const w=window.open('','_blank');
    w.document.write(buildCard(s,s.examName,top3));
    w.document.close();setTimeout(()=>w.print(),600);
  }
  function printAll(){
    if(!results.length)return;
    const top3=[...results].filter(r=>r.pct!==null).sort((a,b)=>b.pct-a.pct).slice(0,3);
    const html=results.map(s=>buildCard(s,s.examName,top3)).join('');
    const w=window.open('','_blank');
    w.document.write('<html><head><style>@media print{.page{page-break-after:always}}</style></head><body>'+html+'</body></html>');
    w.document.close();setTimeout(()=>w.print(),800);
  }

  function printResultSheet(){
    if(!results.length)return;
    const examName=results[0]?.examName||'';
    const sorted=[...results].sort((a,b)=>(b.pct||0)-(a.pct||0));
    const GC=(g)=>({'A+':'#16a34a','A':'#15803d','B':'#ca8a04','C':'#d97706','D':'#dc2626','E':'#991b1b','F':'#7f1d1d','Ab':'#9ca3af'}[g]||'#333');
    const subHdrs=SUBJECTS.map(s=>'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060;text-align:center">'+SDISPLAY[s].split(' ')[0]+'<br/><span style=\'font-size:8px;opacity:0.7\'>Ob/Mx/%/Gr</span></th>').join('');
    const rows=sorted.map((r,i)=>{
      const subs=SUBJECTS.map(sub=>{
        const m=r.subjectMap[sub];
        if(!m)return '<td style="padding:4px 5px;border:1px solid #e5e7eb;text-align:center;font-size:10px;color:#ccc">—</td>';
        const p=m.absent?null:m.total>0?Math.round(m.obt/m.total*100):null;
        const g=m.absent?'Ab':getGrade(p);
        const c=GC(g);
        const inner=m.absent?'<span style="color:#9ca3af">Ab</span>':m.obt!==null?'<b>'+m.obt+'</b>/<span style="color:#aaa">'+m.total+'</span><br/><span style="color:'+c+';font-weight:700">'+p+'%/'+g+'</span>':'<span style="color:#ccc">—</span>';
        return '<td style="padding:4px 5px;border:1px solid #e5e7eb;text-align:center;font-size:10px">'+inner+'</td>';
      }).join('');
      const passed2=results.filter(r=>r.pct!==null&&r.pct>=40).length;
      const failed2=results.filter(r=>r.pct!==null&&r.pct<40).length;
      return '<tr style="background:'+(i%2===0?'#fff':'#f9fafb')+'"><td style="padding:4px 6px;border:1px solid #e5e7eb;text-align:center;font-size:10px;color:'+(r.position<=3?'#d97706':'#aaa')+';font-weight:'+(r.position<=3?700:400)+'">'+(r.position||'—')+'</td><td style="padding:4px 6px;border:1px solid #e5e7eb;font-size:10px"><code style="background:#f3f4f6;padding:1px 3px;border-radius:2px;color:#0E1F3D">'+r.roll_no+'</code></td><td style="padding:4px 6px;border:1px solid #e5e7eb;font-size:11px;font-weight:500">'+r.name+'</td><td style="padding:4px 6px;border:1px solid #e5e7eb;font-size:10px;color:#666">'+(r.father_name||'—')+'</td>'+subs+'<td style="padding:4px 6px;border:1px solid #e5e7eb;text-align:center;font-size:10px;font-weight:600">'+r.totalObt+'/'+r.totalMax+'</td><td style="padding:4px 6px;border:1px solid #e5e7eb;text-align:center;font-size:11px;font-weight:700">'+(r.pct!==null?r.pct+'%':'—')+'</td><td style="padding:4px 6px;border:1px solid #e5e7eb;text-align:center;font-size:12px;font-weight:700;color:'+GC(r.grade)+'">'+r.grade+'</td></tr>';
    }).join('');
    const dist=['A+','A','B','C','D','E','F'].map(g=>{const c=results.filter(r=>r.grade===g).length;return c>0?'<span style="border:1px solid #ddd;padding:1px 7px;border-radius:10px;font-size:10px;margin-right:4px"><b>'+g+'</b>: '+c+'</span>':'';}).join('');
    const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Result Sheet</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;padding:8mm}table{width:100%;border-collapse:collapse}@media print{body{padding:4mm}}</style></head><body>'
      +'<div style="display:flex;align-items:center;border-bottom:3px solid #0E1F3D;padding-bottom:8px;margin-bottom:10px">'
      +'<img src="https://www.coesialkot.com/logo.png" style="width:50px;height:50px;object-fit:contain" onerror="this.style.display='none'"/>'
      +'<div style="text-align:center;flex:1"><div style="font-size:18px;font-weight:900;color:#0E1F3D;text-transform:uppercase;letter-spacing:1px">Centre of Excellence — Boys Sialkot</div>'
      +'<div style="font-size:12px;color:#555;margin-top:2px">'+examName+' · Class '+selClass+' · '+selSection+' Section</div></div>'
      +'<img src="https://www.coesialkot.com/logo.png" style="width:50px;height:50px;object-fit:contain" onerror="this.style.display='none'"/></div>'
      +'<div style="display:flex;gap:16px;margin-bottom:8px;font-size:11px;color:#555">'
      +'<span>Students: <b>'+results.length+'</b></span>'
      +'<span>Passed: <b style="color:#16a34a">'+results.filter(r=>r.pct!==null&&r.pct>=40).length+'</b></span>'
      +'<span>Failed: <b style="color:#dc2626">'+results.filter(r=>r.pct!==null&&r.pct<40).length+'</b></span>'
      +'<span>Avg: <b style="color:#d97706">'+(results.filter(r=>r.pct!==null).length>0?(results.filter(r=>r.pct!==null).reduce((s,r)=>s+(r.pct||0),0)/results.filter(r=>r.pct!==null).length).toFixed(1)+'%':'—')+'</b></span>'
      +'<span style="margin-left:auto">'+dist+'</span></div>'
      +'<table><thead><tr>'
      +'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060">Pos</th>'
      +'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060;text-align:left">Roll No</th>'
      +'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060;text-align:left">Name</th>'
      +'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060;text-align:left">Father</th>'
      +subHdrs
      +'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060">Total</th>'
      +'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060">%</th>'
      +'<th style="padding:5px 6px;background:#0E1F3D;color:#fff;font-size:10px;border:1px solid #1a3060">Grade</th>'
      +'</tr></thead><tbody>'+rows+'</tbody></table>'
      +'<div style="margin-top:12px;display:flex;justify-content:space-between;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:6px">'
      +'<span>Generated: '+new Date().toLocaleString()+'</span><span>COE Sialkot Examination Portal</span></div>'
      +'</body></html>';
    const w=window.open('','_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(),600);
  }

  const passed=results.filter(r=>r.pct!==null&&r.pct>=40).length;
  const failed=results.filter(r=>r.pct!==null&&r.pct<40).length;
  const avgPct=results.filter(r=>r.pct!==null).length>0?(results.filter(r=>r.pct!==null).reduce((s,r)=>s+(r.pct||0),0)/results.filter(r=>r.pct!==null).length).toFixed(1):'—';
  const filtT=teachers.filter(t=>t.class===fClass&&t.section===fSec);
  const lockedSubjects=locks.filter(l=>l.locked).map(l=>l.subject);

  return(
    <div style={{minHeight:'100vh',background:W.bg,fontFamily:'Georgia,serif'}}>
      <div style={{height:4,background:`linear-gradient(90deg,${W.navy},${W.gold})`}}/>

      {/* Header */}
      <div style={{background:W.card,borderBottom:`1px solid ${W.border}`,padding:'0.9rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.75rem',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.85rem'}}>
          <div style={{width:38,height:38,borderRadius:'50%',background:W.gold,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,boxShadow:'0 2px 8px rgba(201,146,42,0.3)'}}>
            <img src="/logo.png" alt="" style={{width:34,height:34,objectFit:'contain'}}/>
          </div>
          <div>
            <h1 style={{margin:0,fontSize:'1.1rem',fontWeight:700,color:W.navy}}>Examination Portal</h1>
            <p style={{margin:0,fontSize:'0.75rem',color:W.textSec}}>COE Sialkot — Admin</p>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          {[['exams','Exams'],['results','Results'],['logins','Teacher Logins']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:'0.5rem 1.1rem',borderRadius:8,border:`1.5px solid ${t===tab?W.navy:W.borderMd}`,background:t===tab?W.navy:W.card,color:t===tab?'#fff':W.textSec,fontWeight:t===tab?700:400,cursor:'pointer',fontSize:'0.82rem',fontFamily:'Georgia,serif'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'2rem 1.5rem'}}>
        {msg&&<div style={{background:msg.startsWith('❌')?W.redBg:W.greenBg,border:`1px solid ${msg.startsWith('❌')?W.redBd:W.greenBd}`,borderRadius:8,padding:'0.9rem 1.2rem',marginBottom:'1.5rem',color:msg.startsWith('❌')?W.redTx:W.greenTx,fontSize:'0.9rem',display:'flex',justifyContent:'space-between',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
          <span>{msg}</span><button onClick={()=>setMsg('')} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:'1.1rem'}}>✕</button>
        </div>}

        {/* ── EXAMS TAB ── */}
        {tab==='exams'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h2 style={{margin:0,color:W.navy,fontSize:'1.05rem'}}>Manage Exams</h2>
              <button onClick={()=>setShowForm(!showForm)} style={{background:W.navy,color:'#fff',border:'none',borderRadius:8,padding:'0.6rem 1.4rem',fontWeight:700,cursor:'pointer',fontSize:'0.88rem'}}>
                {showForm?'✕ Cancel':'+ New Exam'}
              </button>
            </div>
            {showForm&&(
              <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:'1.75rem',marginBottom:'1.5rem',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                <h3 style={{margin:'0 0 1.25rem',color:W.navy,fontSize:'1rem'}}>Create New Exam</h3>
                <form onSubmit={createExam}>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'1rem',marginBottom:'1.25rem'}}>
                    <div>
                      <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Exam Name *</label>
                      <input required style={{...INP,width:'100%',boxSizing:'border-box'}} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Monthly Test 1 — 2025-26"/>
                    </div>
                    <div>
                      <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Exam Type *</label>
                      <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={form.exam_type} onChange={e=>setForm({...form,exam_type:e.target.value})}>
                        {EXAM_TYPES.map(et=><option key={et.value} value={et.value}>{et.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Class *</label>
                      <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={form.class} onChange={e=>setForm({...form,class:e.target.value})}>
                        {CLASSES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={creating} style={{background:W.navy,color:'#fff',border:'none',borderRadius:8,padding:'0.7rem 2rem',fontWeight:700,cursor:'pointer',opacity:creating?0.7:1,fontFamily:'Georgia,serif'}}>
                    {creating?'Creating…':'Create Exam →'}
                  </button>
                </form>
              </div>
            )}
            {loading?<p style={{color:W.textSec}}>Loading…</p>:(
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {exams.map(ex=>(
                  <div key={ex.id} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:10,padding:'1.1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.75rem',boxShadow:'0 2px 6px rgba(0,0,0,0.04)'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.25rem'}}>
                        <span style={{color:W.navy,fontWeight:700,fontSize:'0.95rem'}}>{ex.name}</span>
                        <span style={{background:ex.is_active?W.greenBg:W.redBg,color:ex.is_active?W.greenTx:W.redTx,border:`1px solid ${ex.is_active?W.greenBd:W.redBd}`,padding:'2px 8px',borderRadius:12,fontSize:'0.7rem',fontWeight:600}}>{ex.is_active?'Active':'Closed'}</span>
                      </div>
                      <div style={{color:W.textSec,fontSize:'0.8rem'}}>{EXAM_TYPES.find(t=>t.value===ex.exam_type)?.label} · Class {ex.class} · {ex.academic_year}</div>
                    </div>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      <button onClick={()=>toggleExam(ex)} style={{background:ex.is_active?W.redBg:W.greenBg,color:ex.is_active?W.redTx:W.greenTx,border:`1px solid ${ex.is_active?W.redBd:W.greenBd}`,borderRadius:6,padding:'0.4rem 0.9rem',cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>{ex.is_active?'Close':'Reopen'}</button>
                      <button onClick={()=>deleteExam(ex.id)} style={{background:W.redBg,color:W.redTx,border:`1px solid ${W.redBd}`,borderRadius:6,padding:'0.4rem 0.9rem',cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>Delete</button>
                    </div>
                  </div>
                ))}
                {exams.length===0&&<div style={{textAlign:'center',padding:'3rem',color:W.textSec,background:W.card,borderRadius:12,border:`1px solid ${W.border}`}}>No exams yet. Create your first exam above.</div>}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS TAB ── */}
        {tab==='results'&&(
          <div>
            <h2 style={{margin:'0 0 1.5rem',color:W.navy,fontSize:'1.05rem'}}>Class Result Sheet</h2>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:'1rem',marginBottom:'1.5rem',alignItems:'end'}}>
              <div>
                <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Examination</label>
                <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={selExam} onChange={e=>setSelExam(e.target.value)}>
                  <option value="">Select Exam</option>
                  {exams.filter(ex=>ex.class===selClass).map(ex=><option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Class</label>
                <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={selClass} onChange={e=>{setSelClass(e.target.value);setSelExam('');setResults([]);}}>
                  {CLASSES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'0.35rem',fontWeight:600}}>Section</label>
                <select style={{...INP,width:'100%',boxSizing:'border-box'}} value={selSection} onChange={e=>{setSelSection(e.target.value);setResults([]);}}>
                  {SECTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={loadResults} disabled={!selExam||loadingRes}
                style={{background:W.navy,color:'#fff',border:'none',borderRadius:8,padding:'0.65rem 1.5rem',fontWeight:700,cursor:'pointer',fontSize:'0.88rem',opacity:(!selExam||loadingRes)?0.6:1,whiteSpace:'nowrap',fontFamily:'Georgia,serif'}}>
                {loadingRes?'Loading…':'Load Results'}
              </button>
            </div>

            {results.length>0&&(
              <>
                {/* Lock status bar */}
                {lockedSubjects.length>0&&(
                  <div style={{background:W.redBg,border:`1px solid ${W.redBd}`,borderRadius:10,padding:'1rem 1.5rem',marginBottom:'1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.75rem'}}>
                    <div>
                      <div style={{color:W.redTx,fontWeight:700,fontSize:'0.9rem',marginBottom:'0.25rem'}}>🔒 {lockedSubjects.length} subject(s) locked by teachers</div>
                      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                        {lockedSubjects.map(sub=>(
                          <span key={sub} style={{background:'#fff',border:`1px solid ${W.redBd}`,color:W.redTx,padding:'2px 8px',borderRadius:12,fontSize:'0.72rem',fontWeight:600,display:'flex',alignItems:'center',gap:'0.4rem'}}>
                            {SDISPLAY[sub]}
                            <button onClick={()=>unlockSubject(sub)} style={{background:'none',border:'none',color:W.navy,cursor:'pointer',fontSize:'0.7rem',fontWeight:700,padding:'0 2px'}}>Unlock</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={unlockAll} style={{background:W.navy,color:'#fff',border:'none',borderRadius:8,padding:'0.5rem 1.1rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:700,whiteSpace:'nowrap'}}>
                      🔓 Unlock All
                    </button>
                  </div>
                )}

                {/* Summary */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.25rem'}}>
                  {[['Students',results.length,W.navy],['Passed',passed,W.greenTx],['Failed',failed,W.redTx],['Class Avg',avgPct+'%',W.amber]].map(([l,v,c])=>(
                    <div key={l} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:10,padding:'1rem',textAlign:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.04)'}}>
                      <div style={{color:c,fontSize:'1.8rem',fontWeight:700}}>{v}</div>
                      <div style={{color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:'0.25rem'}}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Grade distribution */}
                <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:10,padding:'0.9rem 1.25rem',marginBottom:'1.25rem',display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.04)'}}>
                  <span style={{color:W.textSec,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:600}}>Grade Distribution:</span>
                  {['A+','A','B','C','D','E','F'].map(g=>{
                    const cnt=results.filter(r=>r.grade===g).length;
                    return cnt>0?<span key={g} style={{background:`${gc(g)}15`,border:`1px solid ${gc(g)}`,color:gc(g),padding:'3px 10px',borderRadius:12,fontSize:'0.75rem',fontWeight:700}}>{g}: {cnt}</span>:null;
                  })}
                </div>

                {/* Action buttons */}
                <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
                  <button onClick={()=>printResultSheet()} style={{background:W.card,color:W.navy,border:`1.5px solid ${W.navy}`,borderRadius:8,padding:'0.55rem 1.2rem',cursor:'pointer',fontSize:'0.82rem',fontWeight:600}}>🖨️ Print Result Sheet</button>
                  <button onClick={printAll} style={{background:W.navy,color:'#fff',border:'none',borderRadius:8,padding:'0.55rem 1.4rem',cursor:'pointer',fontSize:'0.82rem',fontWeight:700}}>📋 Print All Cards ({results.length})</button>
                </div>

                {/* Result Table */}
                <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,overflowX:'auto',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:1200}}>
                    <thead>
                      <tr>
                        <th style={{...TH,textAlign:'left'}}>Pos</th>
                        <th style={{...TH,textAlign:'left'}}>Roll No</th>
                        <th style={{...TH,textAlign:'left',minWidth:130}}>Name</th>
                        <th style={{...TH,textAlign:'left',minWidth:120}}>Father</th>
                        {SUBJECTS.map(s=>(
                          <th key={s} style={TH}>
                            <div style={{fontSize:'0.58rem'}}>{SDISPLAY[s].split(' ')[0]}</div>
                            <div style={{fontSize:'0.5rem',opacity:0.7}}>Ob/Mx/%/Gr</div>
                            {lockedSubjects.includes(s)&&<div style={{fontSize:'0.5rem',color:'#fca5a5'}}>🔒</div>}
                          </th>
                        ))}
                        <th style={TH}>Total</th>
                        <th style={TH}>%</th>
                        <th style={TH}>Grade</th>
                        <th style={TH}>Card</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...results].sort((a,b)=>(b.pct||0)-(a.pct||0)).map((r,i)=>(
                        <tr key={r.id} style={{background:i%2===0?'#fff':'#f9fafb'}}>
                          <td style={{...TD,textAlign:'left',color:r.position<=3?W.amber:W.textMut,fontWeight:r.position<=3?700:400}}>{r.position||'—'}</td>
                          <td style={{...TD,textAlign:'left'}}><code style={{background:'#f3f4f6',padding:'1px 4px',borderRadius:3,color:W.navy,fontSize:'0.7rem',fontWeight:600}}>{r.roll_no}</code></td>
                          <td style={{...TD,textAlign:'left',color:W.text,fontWeight:500,fontSize:'0.78rem'}}>{r.name}</td>
                          <td style={{...TD,textAlign:'left',color:W.textSec,fontSize:'0.72rem'}}>{r.father_name||'—'}</td>
                          {SUBJECTS.map(sub=>{
                            const m=r.subjectMap[sub];
                            if(!m)return<td key={sub} style={{...TD,color:W.textMut}}>—</td>;
                            const p=m.absent?null:m.total>0?Math.round(m.obt/m.total*100):null;
                            const g=m.absent?'Ab':getGrade(p);
                            return(
                              <td key={sub} style={{...TD,fontSize:'0.65rem',padding:'0.3rem 0.4rem',background:lockedSubjects.includes(sub)?'#fef2f250':''}}>
                                {m.absent
                                  ?<span style={{color:W.textMut,fontStyle:'italic'}}>Ab</span>
                                  :m.obt!==null
                                  ?<span>
                                    <span style={{color:W.text,fontWeight:600}}>{m.obt}</span>
                                    <span style={{color:W.textMut}}>/{m.total}</span><br/>
                                    <span style={{color:W.textMut}}>{p}%/</span>
                                    <span style={{color:gc(g),fontWeight:700}}>{g}</span>
                                  </span>
                                  :<span style={{color:W.textMut}}>—</span>
                                }
                              </td>
                            );
                          })}
                          <td style={{...TD,color:W.text,fontWeight:600,fontSize:'0.75rem'}}>{r.totalObt}/{r.totalMax}</td>
                          <td style={{...TD,color:r.pct!==null?W.text:W.textMut,fontWeight:700}}>{r.pct!==null?r.pct+'%':'—'}</td>
                          <td style={{...TD,color:gc(r.grade),fontWeight:700,fontSize:'0.88rem'}}>{r.grade}</td>
                          <td style={{...TD}}>
                            <button onClick={()=>openCard(r)} title="Print Result Card"
                              style={{background:W.navy,color:'#fff',border:'none',borderRadius:4,padding:'3px 8px',cursor:'pointer',fontSize:'0.7rem',fontWeight:700}}>
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

        {/* ── LOGINS TAB ── */}
        {tab==='logins'&&(
          <div>
            <h2 style={{margin:'0 0 1.5rem',color:W.navy,fontSize:'1.05rem'}}>Teacher Login Credentials</h2>
            <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
              <select style={INP} value={fClass} onChange={e=>setFClass(e.target.value)}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>
              <select style={INP} value={fSec} onChange={e=>setFSec(e.target.value)}>{SECTIONS.map(s=><option key={s}>{s}</option>)}</select>
            </div>
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Subject','Login ID','Password'].map(h=><th key={h} style={{...TH,textAlign:'left'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtT.map((t,i)=>(
                    <tr key={t.id} style={{background:i%2===0?'#fff':'#f9fafb'}}>
                      <td style={{...TD,textAlign:'left',color:W.navy,fontWeight:600}}>{t.subject_display}</td>
                      <td style={{...TD,textAlign:'left'}}><code style={{color:W.blue,fontSize:'0.82rem'}}>{t.login}</code></td>
                      <td style={{...TD,textAlign:'left'}}><code style={{color:W.textSec,fontSize:'0.82rem'}}>{t.password}</code></td>
                    </tr>
                  ))}
                  {filtT.length===0&&<tr><td colSpan={3} style={{padding:'2rem',textAlign:'center',color:W.textMut}}>No teachers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div style={{height:4,background:`linear-gradient(90deg,${W.gold},${W.navy})`,marginTop:'2rem'}}/>
      <style>{`@media print{button{display:none!important}}`}</style>
    </div>
  );
}

export default function AdminExams(){
  return <AdminAuth><AdminExamsInner/></AdminAuth>;
}
