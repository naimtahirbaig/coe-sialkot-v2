// src/app/practice-tests/online/page.js
'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

// ── Timer Ring ────────────────────────────────────────────────
function TimerRing({ seconds, totalSeconds }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - seconds / totalSeconds);
  const isDanger  = seconds <= 5;
  const isWarning = seconds <= 15;
  const ringColor = isDanger ? '#f09595' : isWarning ? '#f0b060' : gold;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2,'0')}` : `${secs}s`;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem' }}>
      <div style={{ position:'relative', width:110, height:110 }}>
        <svg width="110" height="110" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={navyMid} strokeWidth="7" />
          <circle cx="55" cy="55" r={r} fill="none" stroke={ringColor} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition:'stroke-dashoffset 1s linear, stroke 0.3s ease' }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize: mins > 0 ? '1.2rem' : '1.4rem', fontWeight:800, color:ringColor, fontFamily:'monospace', lineHeight:1 }}>
            {display}
          </span>
          <span style={{ fontSize:'0.55rem', color:textMut, marginTop:2, textTransform:'uppercase', letterSpacing:1 }}>
            {isDanger ? 'HURRY!' : 'LEFT'}
          </span>
        </div>
      </div>
      {isDanger && (
        <span style={{ color:'#f09595', fontSize:'0.72rem', fontWeight:700 }}>⚠ Time running out!</span>
      )}
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────
function LoginScreen({ testInfo, onLogin }) {
  const CLASSES = ['6th','7th','8th','9th','10th'];
  const [form,    setForm]    = useState({ roll_no:'', class: testInfo?.class || '', password:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fieldStyle = {
    width:'100%', padding:'0.75rem 1rem',
    background: navyDeep, border:`1px solid ${borderLt}`,
    borderRadius:8, color:cream, fontSize:'0.95rem',
    boxSizing:'border-box', fontFamily:'Georgia, serif',
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const res  = await fetch('/api/test-login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Login failed');
    else onLogin(data.student);
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:navy, display:'flex', flexDirection:'column', fontFamily:'Georgia, serif' }}>
      <div style={{ height:4, background:gold }} />

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ width:'100%', maxWidth:440 }}>

          {/* Logo + title */}
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ width:76, height:76, borderRadius:'50%', background:gold, border:`3px solid ${goldLt}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', overflow:'hidden' }}>
              <img src="/logo.png" alt="COE" style={{ width:68, height:68, objectFit:'contain' }} />
            </div>
            <h1 style={{ color:cream, margin:'0 0 0.25rem', fontSize:'1.4rem', fontWeight:700 }}>COE Sialkot</h1>
            <p style={{ color:textSec, margin:0, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.8px' }}>Online Test Portal</p>
          </div>

          {/* Gold rule */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.5rem' }}>
            <div style={{ flex:1, height:1, background:gold }} />
            <span style={{ color:gold, fontSize:14 }}>⚜</span>
            <div style={{ flex:1, height:1, background:gold }} />
          </div>

          {/* Test info */}
          {testInfo && (
            <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:10, padding:'1rem 1.25rem', marginBottom:'1.5rem' }}>
              <h2 style={{ color:cream, margin:'0 0 0.5rem', fontSize:'1rem', fontWeight:600 }}>{testInfo.title}</h2>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'0.6rem' }}>
                {[testInfo.class, testInfo.subject, `${testInfo.total_marks} marks`].filter(Boolean).map(tag => (
                  <span key={tag} style={{ background:navyDeep, color:textSec, fontSize:'0.72rem', padding:'2px 8px', borderRadius:12, border:`1px solid ${border}` }}>{tag}</span>
                ))}
              </div>
              {testInfo.description && <p style={{ margin:0, color:textMut, fontSize:'0.8rem', fontStyle:'italic' }}>{testInfo.description}</p>}
            </div>
          )}

          {/* Login form */}
          <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'1.75rem' }}>
            <h3 style={{ color:goldLt, margin:'0 0 1.25rem', fontSize:'0.88rem', textTransform:'uppercase', letterSpacing:'1px', textAlign:'center' }}>Student Login</h3>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', color:textSec, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Roll Number</label>
                <input required value={form.roll_no} onChange={e => setForm({...form, roll_no:e.target.value})} style={fieldStyle} placeholder="Your roll number" />
              </div>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', color:textSec, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Class</label>
                <select required value={form.class} onChange={e => setForm({...form, class:e.target.value})} style={{ ...fieldStyle, background:navyDeep }}>
                  <option value="">Select Class</option>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', color:textSec, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Password</label>
                <input required type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} style={fieldStyle} placeholder="••••••••" />
              </div>
              {error && <div style={{ background:'#2d0e0e', color:'#f09595', border:'1px solid #f09595', padding:'0.7rem 1rem', borderRadius:8, marginBottom:'1rem', fontSize:'0.85rem', textAlign:'center' }}>{error}</div>}
              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:'0.9rem', background:gold, color:navy, border:'none', borderRadius:10, fontSize:'1rem', fontWeight:700, cursor:'pointer', opacity:loading ? 0.7 : 1, fontFamily:'Georgia, serif' }}>
                {loading ? 'Logging in…' : 'Start Test →'}
              </button>
            </form>
          </div>

          <p style={{ color:textMut, fontSize:'0.72rem', textAlign:'center', marginTop:'1.5rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Punjab Daanish Schools & COE Authority · Govt of Punjab
          </p>
        </div>
      </div>

      <div style={{ height:4, background:gold }} />
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────
function ResultScreen({ result, testInfo, student }) {
  const { obtainedMarks, totalMarks, passingMarks, percentage, passed } = result;

  return (
    <div style={{ minHeight:'100vh', background:navy, display:'flex', flexDirection:'column', fontFamily:'Georgia, serif' }}>
      <div style={{ height:4, background:gold }} />

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ width:'100%', maxWidth:460, textAlign:'center' }}>

          {/* Logo */}
          <div style={{ width:76, height:76, borderRadius:'50%', background:gold, border:`3px solid ${goldLt}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', overflow:'hidden' }}>
            <img src="/logo.png" alt="COE" style={{ width:68, height:68, objectFit:'contain' }} />
          </div>

          {/* Gold rule */}
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'0 auto 1.5rem', maxWidth:220 }}>
            <div style={{ flex:1, height:1, background:gold }} />
            <span style={{ color:gold, fontSize:14 }}>⚜</span>
            <div style={{ flex:1, height:1, background:gold }} />
          </div>

          {/* Pass/Fail */}
          <div style={{ color:passed ? goldLt : '#f09595', fontSize:'2.5rem', fontWeight:700, letterSpacing:'4px', marginBottom:'0.4rem' }}>
            {passed ? 'PASS' : 'FAIL'}
          </div>
          <p style={{ color:textSec, fontSize:'0.85rem', marginBottom:'2rem', textTransform:'uppercase', letterSpacing:'0.8px' }}>
            {passed ? 'Congratulations!' : 'Better luck next time'}
          </p>

          {/* Score card */}
          <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:16, padding:'2rem', marginBottom:'1.25rem' }}>
            <div style={{ color:gold, fontSize:'4.5rem', fontWeight:700, lineHeight:1, fontFamily:'Georgia, serif' }}>{percentage}%</div>
            <div style={{ color:textMut, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'1.5rem' }}>Overall percentage</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem', borderTop:`1px solid ${border}`, paddingTop:'1.25rem' }}>
              {[['Obtained', obtainedMarks], ['Total', totalMarks], ['To Pass', passingMarks]].map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ color:cream, fontSize:'1.5rem', fontWeight:600 }}>{val}</div>
                  <div style={{ color:textMut, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Student info */}
          <div style={{ background:navyDeep, border:`1px solid ${border}`, borderRadius:10, padding:'1rem 1.25rem', textAlign:'left', marginBottom:'1.25rem' }}>
            <div style={{ color:textMut, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem' }}>Student</div>
            <div style={{ color:cream, fontSize:'0.92rem', fontWeight:600 }}>{student?.name} — {student?.roll_no}</div>
            <div style={{ color:textSec, fontSize:'0.8rem', marginTop:2 }}>{student?.class} · {student?.section}</div>
            {testInfo && <div style={{ color:textMut, fontSize:'0.78rem', marginTop:4 }}>{testInfo.title}</div>}
          </div>

          <button onClick={() => window.print()}
            style={{ background:gold, color:navy, border:'none', borderRadius:10, padding:'0.8rem 2rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer', fontFamily:'Georgia, serif' }}>
            🖨️ Print Result
          </button>

          <p style={{ color:textMut, fontSize:'0.72rem', marginTop:'1.5rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Punjab Daanish Schools & COE Authority · Govt of Punjab
          </p>
        </div>
      </div>

      <div style={{ height:4, background:gold }} />
      <style>{`@media print { button { display:none!important; } body { background:white!important; } }`}</style>
    </div>
  );
}

// ── Test Screen ───────────────────────────────────────────────
function TestScreen({ testInfo, questions, student, onSubmit }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const intervalRef  = useRef(null);
  const startTimeRef = useRef(Date.now());

  const q = questions[currentIdx];
  const isObjective = ['mcq','true_false','fill_blank'].includes(q?.question_type);
  const totalSecs   = isObjective ? (testInfo?.time_limit_objective || 60) : (testInfo?.time_limit_short || 300);

  useEffect(() => {
    if (!q) return;
    setTimeLeft(totalSecs);
    startTimeRef.current = Date.now();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setTimeout(() => handleNext(true), 100); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [currentIdx]);

  const handleNext = useCallback((auto = false) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    setAnswers(prev => ({ ...prev, [q.id]: { answer: prev[q.id]?.answer || '', timeTaken } }));
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
    else handleSubmit();
  }, [currentIdx, q, questions.length]);

  async function handleSubmit() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSubmitting(true);
    const answerArray = questions.map(question => ({
      questionId: question.id,
      studentAnswer: answers[question.id]?.answer || '',
      timeTaken:     answers[question.id]?.timeTaken || 0,
    }));
    const res  = await fetch('/api/submit-test', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ testId:testInfo.id, studentId:student.id, answers:answerArray }) });
    const data = await res.json();
    if (res.ok) onSubmit(data.result);
    else { alert(data.error || 'Submission failed. Please try again.'); setSubmitting(false); }
  }

  if (!q) return null;

  const currentAnswer = answers[q.id]?.answer || '';
  const progress      = ((currentIdx + 1) / questions.length) * 100;

  const typeMeta = {
    mcq:        { label:'Multiple choice', color:'#a8c8f0', bg:'#1e3566' },
    true_false: { label:'True / False',    color:greenTx,   bg:greenBg   },
    fill_blank: { label:'Fill in blank',   color:'#c4b5fd', bg:'#2e1a5a' },
    short:      { label:'Short answer',    color:goldLt,    bg:'#3d2808' },
  }[q.question_type] || { label:q.question_type, color:textSec, bg:navyMid };

  return (
    <div style={{ minHeight:'100vh', background:navy, fontFamily:'Georgia, serif' }}>
      <div style={{ height:3, background:gold }} />

      {/* Topbar */}
      <div style={{ background:navyMid, borderBottom:`1px solid ${border}`, padding:'0.75rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:gold, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <img src="/logo.png" alt="COE" style={{ width:24, height:24, objectFit:'contain' }} />
          </div>
          <div>
            <div style={{ color:textMut, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>{testInfo.title}</div>
            <div style={{ color:goldLt, fontSize:'0.85rem', fontWeight:600 }}>{student.name} · {student.roll_no}</div>
          </div>
        </div>
        <div style={{ color:textSec, fontSize:'0.85rem' }}>Q {currentIdx + 1} / {questions.length}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:navyDeep }}>
        <div style={{ height:'100%', width:`${progress}%`, background:gold, transition:'width 0.4s ease' }} />
      </div>

      {/* Body */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:'2rem', alignItems:'start' }}>

          {/* Question area */}
          <div>
            {/* Badge */}
            <span style={{ background:typeMeta.bg, color:typeMeta.color, border:`1px solid ${typeMeta.color}33`, fontSize:'0.7rem', padding:'3px 10px', borderRadius:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              {typeMeta.label} · {q.marks} mark{q.marks > 1 ? 's' : ''}
            </span>

            {/* Question text */}
            <div style={{ color:cream, fontSize:'1.05rem', lineHeight:1.75, margin:'1rem 0 1.5rem' }}>
              <span style={{ color:textMut, fontSize:'0.88rem', marginRight:'0.5rem' }}>Q{q.question_no}.</span>
              {q.question_text}
            </div>

            {/* MCQ */}
            {q.question_type === 'mcq' && q.options && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {q.options.map((opt, i) => {
                  const letter = opt.match(/^([A-D])\./)?.[1] || String.fromCharCode(65 + i);
                  const sel    = currentAnswer === letter;
                  return (
                    <button key={i} onClick={() => setAnswers(prev => ({...prev, [q.id]:{...prev[q.id], answer:letter}}))}
                      style={{ textAlign:'left', padding:'0.85rem 1.1rem', background:sel ? navyMid : navyDeep, border:`1px solid ${sel ? gold : border}`, borderRadius:9, color:sel ? cream : textSec, cursor:'pointer', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'0.75rem', transition:'all 0.15s ease' }}>
                      <span style={{ width:26, height:26, borderRadius:'50%', background:sel ? gold : border, color:sel ? navy : textMut, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, flexShrink:0 }}>{letter}</span>
                      {opt.replace(/^[A-D]\.\s*/,'')}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True / False */}
            {q.question_type === 'true_false' && (
              <div style={{ display:'flex', gap:'1rem' }}>
                {['True','False'].map(opt => {
                  const sel = currentAnswer === opt;
                  return (
                    <button key={opt} onClick={() => setAnswers(prev => ({...prev, [q.id]:{...prev[q.id], answer:opt}}))}
                      style={{ flex:1, padding:'1.1rem', background:sel ? (opt==='True' ? greenBg : '#2d0e0e') : navyDeep, border:`1px solid ${sel ? (opt==='True' ? greenTx : '#f09595') : border}`, borderRadius:10, color:sel ? (opt==='True' ? greenTx : '#f09595') : textSec, cursor:'pointer', fontSize:'1rem', fontWeight:700, textAlign:'center' }}>
                      {opt === 'True' ? '✓ True' : '✗ False'}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill blank */}
            {q.question_type === 'fill_blank' && (
              <input value={currentAnswer} onChange={e => setAnswers(prev => ({...prev, [q.id]:{...prev[q.id], answer:e.target.value}}))}
                style={{ width:'100%', padding:'0.9rem 1.1rem', background:navyDeep, border:`1px solid ${borderLt}`, borderRadius:9, color:cream, fontSize:'0.95rem', boxSizing:'border-box', fontFamily:'Georgia, serif' }}
                placeholder="Type your answer here…" />
            )}

            {/* Short answer */}
            {q.question_type === 'short' && (
              <textarea value={currentAnswer} onChange={e => setAnswers(prev => ({...prev, [q.id]:{...prev[q.id], answer:e.target.value}}))}
                style={{ width:'100%', padding:'0.9rem 1.1rem', background:navyDeep, border:`1px solid ${borderLt}`, borderRadius:9, color:cream, fontSize:'0.9rem', boxSizing:'border-box', fontFamily:'Georgia, serif', minHeight:140, resize:'vertical', lineHeight:1.6 }}
                placeholder="Write your answer here…" />
            )}

            {/* Next button */}
            <button onClick={() => handleNext(false)} disabled={submitting}
              style={{ marginTop:'1.75rem', background:gold, color:navy, border:'none', borderRadius:10, padding:'0.85rem 2.25rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', opacity:submitting ? 0.7 : 1, fontFamily:'Georgia, serif' }}>
              {submitting ? 'Submitting…' : currentIdx < questions.length - 1 ? 'Next Question →' : '✅ Submit Test'}
            </button>
          </div>

          {/* Timer + Navigator */}
          <div style={{ position:'sticky', top:'1.5rem' }}>
            {timeLeft !== null && <TimerRing seconds={timeLeft} totalSeconds={totalSecs} />}

            {/* Q navigator */}
            <div style={{ marginTop:'1.25rem', background:navyMid, border:`1px solid ${border}`, borderRadius:10, padding:'0.9rem' }}>
              <div style={{ color:textMut, fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.6rem' }}>Questions</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'0.3rem' }}>
                {questions.map((_,i) => (
                  <div key={i} style={{
                    width:24, height:24, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.65rem', fontWeight:700,
                    background: i === currentIdx ? gold : answers[questions[i].id]?.answer ? greenBg : navyDeep,
                    color:      i === currentIdx ? navy  : answers[questions[i].id]?.answer ? greenTx : textMut,
                    border: `1px solid ${i === currentIdx ? gold : border}`,
                  }}>{i+1}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height:3, background:gold }} />
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────
function OnlineTestContent() {
  const searchParams = useSearchParams();
  const testId = searchParams.get('test');

  const [phase,     setPhase]     = useState('login');
  const [testInfo,  setTestInfo]  = useState(null);
  const [questions, setQuestions] = useState([]);
  const [student,   setStudent]   = useState(null);
  const [result,    setResult]    = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => { if (testId) loadTest(); }, [testId]);

  async function loadTest() {
    const { data:test, error } = await supabase
      .from('online_tests').select('*').eq('id', testId).eq('status','active').single();
    if (error || !test) { setLoadError('This test is not available. Please check the link or contact your teacher.'); return; }
    setTestInfo(test);
  }

  async function handleLogin(studentData) {
    setStudent(studentData);
    const { data:attempt } = await supabase
      .from('test_attempts').select('id,status,obtained_marks,total_marks,percentage,passed')
      .eq('test_id', testId).eq('student_id', studentData.id).single();
    if (attempt?.status === 'submitted') {
      setResult({ obtainedMarks:attempt.obtained_marks, totalMarks:attempt.total_marks, passingMarks:testInfo.passing_marks, percentage:attempt.percentage, passed:attempt.passed });
      setPhase('result'); return;
    }
    const { data:qs } = await supabase
      .from('test_questions').select('id,question_no,question_text,question_type,options,marks')
      .eq('test_id', testId).order('question_no');
    if (!qs || qs.length === 0) { setLoadError('No questions found for this test.'); return; }
    setQuestions(qs);
    setPhase('test');
  }

  const errorScreen = (msg) => (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:navy, color:cream, fontFamily:'Georgia, serif', textAlign:'center', padding:'2rem', flexDirection:'column', gap:'1rem' }}>
      <div style={{ width:60, height:60, borderRadius:'50%', background:gold, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>⚠</div>
      <h2 style={{ color:cream, margin:0 }}>Test Unavailable</h2>
      <p style={{ color:textSec, maxWidth:400, margin:0 }}>{msg}</p>
    </div>
  );

  if (!testId)   return errorScreen('No test selected. Please use the link provided by your teacher.');
  if (loadError) return errorScreen(loadError);
  if (phase === 'login')  return <LoginScreen testInfo={testInfo} onLogin={handleLogin} />;
  if (phase === 'test')   return <TestScreen testInfo={testInfo} questions={questions} student={student} onSubmit={r => { setResult(r); setPhase('result'); }} />;
  if (phase === 'result') return <ResultScreen result={result} testInfo={testInfo} student={student} />;
  return null;
}

export default function OnlineTestPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0E1F3D', color:'#F5E6C3', fontFamily:'Georgia, serif' }}>
        Loading test…
      </div>
    }>
      <OnlineTestContent />
    </Suspense>
  );
}
