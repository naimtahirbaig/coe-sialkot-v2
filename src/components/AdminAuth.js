// src/components/AdminAuth.js
'use client';
import { useState, useEffect } from 'react';

const ADMIN_USER = 'Naim@Mutahhara';
const ADMIN_PASS = 'Mutahhara@786';
const SESSION_KEY = 'coe_admin_auth';

const navy     = '#0E1F3D';
const navyMid  = '#162a50';
const navyDeep = '#0a1628';
const gold     = '#C9922A';
const goldLt   = '#E8B84B';
const cream    = '#F5E6C3';
const textSec  = '#9ab0d8';
const border   = '#2e4a80';
const borderLt = '#3a5a90';
const greenBg  = '#1a4025';
const greenTx  = '#7dd88a';

export default function AdminAuth({ children }) {
  const [authed,   setAuthed]   = useState(false);
  const [checked,  setChecked]  = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === 'true') setAuthed(true);
    setChecked(true);
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setAuthed(true);
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 400);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setUsername('');
    setPassword('');
  }

  if (!checked) return null;

  if (!authed) return (
    <div style={{ minHeight:'100vh', background:navy, display:'flex', flexDirection:'column', fontFamily:'Georgia, serif' }}>
      <div style={{ height:4, background:gold }} />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ width:'100%', maxWidth:380 }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:gold, border:`3px solid ${goldLt}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', overflow:'hidden' }}>
              <img src="/logo.png" alt="COE" style={{ width:64, height:64, objectFit:'contain' }} />
            </div>
            <h1 style={{ color:cream, margin:'0 0 0.25rem', fontSize:'1.3rem', fontWeight:700 }}>COE Sialkot</h1>
            <p style={{ color:textSec, margin:0, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.8px' }}>Admin Portal</p>
          </div>

          {/* Gold rule */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.75rem' }}>
            <div style={{ flex:1, height:1, background:gold }} />
            <span style={{ color:gold, fontSize:14 }}>⚜</span>
            <div style={{ flex:1, height:1, background:gold }} />
          </div>

          {/* Login form */}
          <div style={{ background:navyMid, border:`1px solid ${border}`, borderRadius:12, padding:'2rem' }}>
            <h2 style={{ color:goldLt, margin:'0 0 1.5rem', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', textAlign:'center' }}>Sign In</h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Username</label>
                <input required value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"
                  style={{ width:'100%', padding:'0.75rem 1rem', background:navyDeep, border:`1px solid ${borderLt}`, borderRadius:8, color:cream, fontSize:'0.95rem', boxSizing:'border-box', fontFamily:'Georgia, serif' }}
                  placeholder="Admin username" />
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', color:textSec, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem', fontWeight:600 }}>Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                  style={{ width:'100%', padding:'0.75rem 1rem', background:navyDeep, border:`1px solid ${borderLt}`, borderRadius:8, color:cream, fontSize:'0.95rem', boxSizing:'border-box', fontFamily:'Georgia, serif' }}
                  placeholder="••••••••" />
              </div>
              {error && (
                <div style={{ background:'#2d0e0e', color:'#f09595', border:'1px solid #f09595', padding:'0.7rem 1rem', borderRadius:8, marginBottom:'1rem', fontSize:'0.85rem', textAlign:'center' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:'0.9rem', background:gold, color:navy, border:'none', borderRadius:10, fontSize:'1rem', fontWeight:700, cursor:'pointer', opacity:loading ? 0.7 : 1, fontFamily:'Georgia, serif' }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          </div>

          <p style={{ color:'#2a3f6a', fontSize:'0.7rem', textAlign:'center', marginTop:'1.5rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Punjab Daanish Schools & COE Authority
          </p>
        </div>
      </div>
      <div style={{ height:4, background:gold }} />
    </div>
  );

  return (
    <>
      {/* Logout bar */}
      <div style={{ background:navyDeep, borderBottom:`1px solid ${border}`, padding:'0.5rem 1.5rem', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'1rem' }}>
        <span style={{ color:textSec, fontSize:'0.78rem' }}>Signed in as <strong style={{ color:goldLt }}>Naim@Mutahhara</strong></span>
        <button onClick={handleLogout}
          style={{ background:'#2d0e0e', color:'#f09595', border:'1px solid #f09595', borderRadius:6, padding:'0.3rem 0.9rem', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
          Sign Out
        </button>
      </div>
      {children}
    </>
  );
}
