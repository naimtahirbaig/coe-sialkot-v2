'use client';
// The inner-page template (same layout as the ISKL inner pages):
// photo banner under the header · gold section bar with the section's pages · breadcrumb ·
// big two-weight title · optional "On this page" box on the left · page content.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SECTIONS } from './siteData';

export function PageHead({ section = 'students', title, light, crumb, lede, photo, short = false }) {
  const sec = SECTIONS[section] || SECTIONS.students;
  const path = usePathname() || '';
  return (
    <>
      <div className={`ip-banner${short ? ' short' : ''}`} style={{ backgroundImage: `url(${photo || sec.photo})` }} aria-hidden="true" />
      <nav className="ip-bar" aria-label={`${sec.label} pages`}>
        <div className="ip-bar-in">
          <Link href={sec.href} className="ip-sec">{sec.label}</Link>
          <div className="ip-sub">
            {sec.sub.map((s) => <a key={s.href} href={s.href} aria-current={s.href === path || (s.href !== '/' && path.startsWith(s.href + '/')) ? 'page' : undefined}>{s.label}</a>)}
          </div>
        </div>
      </nav>
      <div className="ip-wrap">
        <ol className="ip-crumbs" aria-label="You are here">
          <li><Link href="/">Home</Link></li>
          <li><Link href={sec.href}>{sec.label}</Link></li>
          <li aria-current="page">{crumb || [title, light].filter(Boolean).join(' ')}</li>
        </ol>
        <h1 className="ip-title">{title}{light ? <> <span>{light}</span></> : null}</h1>
        {lede && <p className="ip-lede u">{lede}</p>}
      </div>
    </>
  );
}

export default function InnerPage({
  section = 'students', title, light, crumb, lede, toc, photo, short = false, tool = false, children,
}) {
  const [onId, setOnId] = useState(toc && toc[0] ? toc[0].id : '');

  // highlight the "On this page" item for the part being read
  useEffect(() => {
    if (!toc || !toc.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => {
      const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setOnId(v.target.id);
    }, { rootMargin: '-30% 0px -60% 0px' });
    toc.forEach((t) => { const el = document.getElementById(t.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [toc]);

  return (
    <div className="ip">
      <PageHead section={section} title={title} light={light} crumb={crumb} lede={lede} photo={photo} short={short} />
      {tool ? (
        <div className="ip-tool"><div className="ip-wrap">{children}</div></div>
      ) : (
        <div className="ip-wrap">
          <div className={`ip-grid${toc && toc.length ? '' : ' full'}`}>
            {toc && toc.length > 0 && (
              <aside className="ip-toc" aria-label="On this page">
                <h2>On This Page</h2>
                <ul>{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className={onId === t.id ? 'on' : ''}>{t.label}</a></li>)}</ul>
              </aside>
            )}
            <div className="ip-body">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
