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
    <div className="ip-wrap">
      <div className="ip-signin">
        <div className="ip-signin-side">
          <img src="/logo.png" alt="" width="88" height="88" />
          <h2>Office sign in</h2>
          <p>School administration tools: papers, student records, online tests, award lists and result cards.</p>
        </div>
        <form className="ip-signin-form" onSubmit={handleLogin}>
          <label>Username<input className="ip-field" required value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" placeholder="Admin username" /></label>
          <label>Password<input className="ip-field" required type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Password" /></label>
          {error && <p className="ip-err" role="alert">{error}</p>}
          <button type="submit" className="ip-btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
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
