'use client';
// Header ribbon, phone menu, gold quick buttons and footer — shown on every page of the site.
// The header is see-through over a photo (home page and pages with a banner) and solid elsewhere.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MENU, QUICK, AUTHORITIES, FOOT_LINKS, pageFor } from './siteData';
import { PageHead } from './InnerPage';
import LiveStats, { track, watchDownloads } from './LiveStats';

export function Icon({ name, size = 22 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'pencil') return <svg {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>;
  if (name === 'check') return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.5 2.5 5-6" /></svg>;
  if (name === 'bell') return <svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
  if (name === 'book') return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7" /></svg>;
  if (name === 'cal') return <svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>;
  if (name === 'user') return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>;
  return null;
}

// which top-menu item the current page belongs to
function currentTop(path) {
  if (/^\/(question-bank|online-test-setup|online-test-results|award-list|proformas|admin|exam\/)/.test(path)) return 'Teachers';
  if (/^\/(exams|result-cards|mid-term|notes)/.test(path)) return 'Notes & Exams';
  if (/^\/notice-board/.test(path)) return 'Notice Board';
  if (/^\/(practice-tests|online-tests|student-resources)/.test(path)) return 'Students';
  return '';
}

export default function SiteChrome({ children }) {
  const path = usePathname() || '/';
  const home = path === '/';
  const [open, setOpen] = useState(-1);
  const [mob, setMob] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overPhoto, setOverPhoto] = useState(home);
  const headRef = useRef(null);
  const cur = currentTop(path);
  const pg = home ? null : pageFor(path);
  const framed = pg && !pg.own;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(-1); setMob(false); } };
    const onDoc = (e) => { if (headRef.current && !headRef.current.contains(e.target)) setOpen(-1); };
    document.addEventListener('keydown', onKey); document.addEventListener('click', onDoc);
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onKey); document.removeEventListener('click', onDoc); };
  }, []);
  // see-through header only when a photo sits under it
  useEffect(() => {
    setOpen(-1); setMob(false);
    const check = () => setOverPhoto(home || !!document.querySelector('.ip-banner'));
    if (framed) setOverPhoto(true);
    check(); const id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, [path, home, framed]);

  // count visitors, page views and downloads (shown in the Live numbers)
  useEffect(() => { track(path); }, [path]);
  useEffect(() => watchDownloads(track()), []);

  const solid = scrolled || !overPhoto;

  return (
    <>
      <div className="sc">
        <a href="#main" className="sc-skip">Skip to content</a>
        <header ref={headRef} className={`sc-head${solid ? ' solid' : ''}${open >= 0 ? ' menu-open' : ''}`} onMouseLeave={() => setOpen(-1)}>
          <Link href="/" className="sc-badge" aria-label="Centre of Excellence Sialkot (Boys), home">
            <img src="/logo.png" alt="" width="150" height="150" />
          </Link>
          <div className="sc-rows">
            <div className="sc-util">
              <span className="sc-name">Centre of Excellence Sialkot <b>(Boys)</b></span>
              <nav aria-label="Quick links">
                <a href="/notes-2026.html">Notes &amp; expected questions</a>
                <a href="/mid-term-2026-27.html" className="sc-hot">Mid-Term date sheet</a>
                <Link href="/notice-board">Notice board</Link>
                <Link href="/login" className="sc-sign"><Icon name="user" />Sign in</Link>
              </nav>
            </div>
            <nav className="sc-nav" aria-label="Main">
              {MENU.map((m, i) => m.href ? (
                <Link key={m.label} href={m.href} className={`sc-top${cur === m.label ? ' cur' : ''}`} aria-current={cur === m.label ? 'page' : undefined} onMouseEnter={() => setOpen(-1)}>{m.label}</Link>
              ) : (
                <button key={m.label} type="button" className={`sc-top${open === i ? ' on' : ''}${cur === m.label ? ' cur' : ''}`}
                  aria-expanded={open === i} aria-controls={`sc-panel-${i}`}
                  onMouseEnter={() => setOpen(i)} onClick={(e) => { e.stopPropagation(); setOpen(open === i ? -1 : i); }}>{m.label}</button>
              ))}
              <a href="/practice-tests-2026.html" className="sc-cta">Start practising</a>
            </nav>
          </div>
          <button type="button" className="sc-burger" aria-label="Menu" aria-expanded={mob} onClick={() => setMob(true)}><span /><span /><span /></button>
          {MENU.map((m, i) => !m.href && (
            <div key={m.label} id={`sc-panel-${i}`} className="sc-panel" hidden={open !== i}>
              <div className="sc-panel-in">
                <div className="sc-panel-intro"><h2>{m.label}</h2><p>{m.intro}</p></div>
                <ul>{m.links.map((l) => <li key={l.href + l.title}><a href={l.href}><b>{l.title}</b><span>{l.text}</span></a></li>)}</ul>
              </div>
            </div>
          ))}
        </header>

        <div className="sc-mob" hidden={!mob} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="sc-mob-top">
            <img src="/logo.png" alt="" width="54" height="54" />
            <button type="button" aria-label="Close menu" onClick={() => setMob(false)}>×</button>
          </div>
          {MENU.map((m) => m.href ? (
            <a key={m.label} href={m.href} className="sc-mob-link" onClick={() => setMob(false)}>{m.label}</a>
          ) : (
            <details key={m.label}>
              <summary>{m.label}</summary>
              {m.links.map((l) => <a key={l.href + l.title} href={l.href} onClick={() => setMob(false)}>{l.title}</a>)}
            </details>
          ))}
          <Link href="/login" className="sc-mob-sign" onClick={() => setMob(false)}>Sign in</Link>
        </div>

        <nav className="sc-quick" aria-label="Quick access">
          {QUICK.map((q) => <a key={q.href} href={q.href}><Icon name={q.icon} /><span>{q.label}</span></a>)}
        </nav>
        {!home && <div className="sc-spacer" aria-hidden="true" />}
      </div>

      <div id="main">
        {framed ? (
          <div className="ip">
            <PageHead section={pg.section} title={pg.title} light={pg.light} crumb={pg.crumb} lede={pg.lede} photo={pg.photo} short />
            <div className={`ip-tool${pg.dark ? ' dark' : ''}`}>{children}</div>
          </div>
        ) : children}
      </div>

      <footer className="sc sc-foot">
        <div className="sc-foot-card">
          <div className="sc-foot-top">
            <div className="sc-foot-id">
              <img src="/logo.png" alt="" width="120" height="120" />
              <p>Centre of Excellence<br />Sialkot (Boys)</p>
            </div>
            <div className="sc-foot-right">
              <div className="sc-foot-logos">{AUTHORITIES.map((a) => <img key={a.name} src={a.src} alt={a.name} width="52" height="52" />)}</div>
              <p>Punjab Daanish Schools &amp; Centres of Excellence Authority, Government of the Punjab</p>
              <p className="sc-foot-ur" lang="ur" dir="rtl">سینٹر آف ایکسیلینس سیالکوٹ (بوائز)</p>
            </div>
          </div>
          <nav className="sc-foot-links" aria-label="Footer">
            {FOOT_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <LiveStats variant="strip" />
          <p className="sc-foot-credit">Designed and developed by <b>Dr Naim Tahir Baig</b>. © {new Date().getFullYear()} Centre of Excellence Sialkot (Boys)</p>
        </div>
      </footer>
    </>
  );
}
