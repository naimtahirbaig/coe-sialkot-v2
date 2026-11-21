'use client';
// Live website numbers: visitors, downloads, tests taken, papers generated.
// "band" = the big section on the home page; "strip" = the line above the footer on every page.
import { useEffect, useRef, useState } from 'react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// one shared request per page
let pending = null;
export function loadStats() {
  if (!pending) pending = fetch('/api/stats', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return pending;
}

// counts up from 0 the first time the number comes into view
function Count({ to }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!to) { setV(0); return; }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') { setV(to); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{fmt(v)}</span>;
}

export default function LiveStats({ variant = 'band' }) {
  const [s, setS] = useState(null);
  useEffect(() => {
    let live = true;
    loadStats().then((d) => { if (live && d) setS(d); });
    return () => { live = false; };
  }, []);

  const items = [
    { key: 'visitors', label: 'Visitors', note: s ? `${fmt(s.visitorsToday)} today` : '', icon: 'eye' },
    { key: 'downloads', label: 'Downloads', note: 'notes, papers and files', icon: 'down' },
    { key: 'testsTaken', label: 'Tests taken', note: s ? `${fmt(s.onlineTests)} online, ${fmt(s.practiceTests)} practice` : '', icon: 'check' },
    { key: 'papers', label: 'Papers generated', note: 'in the Question Bank', icon: 'paper' },
  ];

  if (variant === 'strip') {
    return (
      <div className="ls-strip" aria-label="Website numbers">
        <span className="ls-live"><i aria-hidden="true" />Live</span>
        {items.map((it) => <span key={it.key}><b>{s ? fmt(s[it.key]) : '…'}</b> {it.label.toLowerCase()}</span>)}
      </div>
    );
  }
  return (
    <section className="ls-band" aria-labelledby="ls-h">
      <div className="ls-in">
        <h2 id="ls-h"><span className="ls-live"><i aria-hidden="true" />Live</span> The website in numbers</h2>
        <ul>
          {items.map((it) => (
            <li key={it.key}>
              <Icon name={it.icon} />
              <b>{s ? <Count to={s[it.key]} /> : '…'}</b>
              <span className="ls-l">{it.label}</span>
              <span className="ls-n">{it.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Icon({ name }) {
  const p = { width: 34, height: 34, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className: 'ls-i' };
  if (name === 'eye') return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
  if (name === 'down') return <svg {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 19h16" /></svg>;
  if (name === 'check') return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.5 2.5 5-6" /></svg>;
  return <svg {...p}><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h7" /></svg>;
}

// Counting: called by the site header on every page
export function track(path) {
  const send = (k) => {
    const body = JSON.stringify({ k });
    try { if (navigator.sendBeacon && navigator.sendBeacon('/api/stats/hit', new Blob([body], { type: 'application/json' }))) return; } catch { /* fall back */ }
    fetch('/api/stats/hit', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  };
  const get = (k) => { try { return localStorage.getItem(k); } catch { return '1'; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
  const day = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
  if (!get('coe_v')) { put('coe_v', '1'); send('visitor'); }
  if (get('coe_d') !== day) { put('coe_d', day); send('day'); }
  if (path !== undefined) send('view');
  return send;
}

// count a download whenever a file link is clicked (also the Question Bank's PDF / Word / PNG buttons)
export function watchDownloads(send) {
  const onClick = (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.hasAttribute('download') || /\.(pdf|docx?|xlsx?|pptx?|zip|png|jpe?g)(\?|#|$)/i.test(href) && !/\/home\/|\/og\/|logo/i.test(href)) send('download');
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
