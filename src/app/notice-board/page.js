'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import InnerPage from '@/components/site/InnerPage';

const day = (d) => new Date(d);
const fmtLong = (d) => day(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('public_notices')
        .select('*')
        .eq('is_visible', true)
        .order('is_pinned', { ascending: false })
        .order('notice_date', { ascending: false });
      setNotices(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  const match = (n) => !q || `${n.title} ${n.body || ''}`.toLowerCase().includes(q.toLowerCase());
  const pinned = notices.filter((n) => n.is_pinned && match(n));
  const regular = notices.filter((n) => !n.is_pinned && match(n));

  const toc = [
    { id: 'pinned', label: 'Pinned notices' },
    { id: 'all', label: 'All notices' },
    { id: 'exams', label: 'Upcoming examination' },
  ];

  return (
    <InnerPage section="notices" title="Notice" light="Board" toc={toc}
      lede="Official announcements from the school administration, newest first.">
      <div className="nb-search">
        <label htmlFor="nb-q">Search notices</label>
        <input id="nb-q" className="ip-field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a word, e.g. date sheet" />
      </div>

      <section id="pinned">
        <h2>Pinned notices</h2>
        {loading ? <Skeleton /> : pinned.length ? <NoticeList items={pinned} /> : <p className="ip-empty">No pinned notices right now.</p>}
      </section>

      <hr className="ip-rule" />

      <section id="all">
        <h2>All notices</h2>
        {loading ? <Skeleton /> : regular.length ? <NoticeList items={regular} /> : <p className="ip-empty">{q ? 'No notices match your search.' : 'No other notices yet.'}</p>}
      </section>

      <hr className="ip-rule" />

      <section id="exams">
        <h2>Upcoming examination</h2>
        <p className="ip-lede">Mid-Term School Based Assessment 2026-27 for Classes 6, 7 and 8 starts on Monday 7 December 2026.</p>
        <div className="ip-btnrow">
          <a className="ip-btn" href="/mid-term-2026-27.html">Date sheet</a>
          <a className="ip-btn navy" href="/mid-term-2026-27.html#syllabus">Syllabus</a>
          <a className="ip-btn line" href="/notes-2026.html">Notes &amp; expected questions</a>
        </div>
      </section>
    </InnerPage>
  );
}

function Skeleton() {
  return <ul className="ip-dates" aria-busy="true">{[0, 1, 2].map((i) => <li key={i}><span className="ip-date nb-ghost" /><span className="nb-ghost-line" /></li>)}</ul>;
}

function NoticeList({ items }) {
  return (
    <ul className="ip-dates">
      {items.map((n) => {
        const d = day(n.notice_date);
        return (
          <li key={n.id}>
            <span className="ip-date" aria-hidden="true">
              <small>{d.toLocaleDateString('en-GB', { month: 'short' })}</small>
              <b>{d.getDate()}</b>
              <i>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</i>
            </span>
            <div>
              <h3>{n.title}{n.is_pinned && <span className="ip-tag gold">Pinned</span>}</h3>
              <div className="ip-meta"><span>{fmtLong(n.notice_date)}</span></div>
              {n.body && (
                <details className="nb-more">
                  <summary>Read notice</summary>
                  <div className="nb-body">{n.body}</div>
                </details>
              )}
              {n.file_url && <a className="ip-btn nb-file" href={n.file_url} target="_blank" rel="noopener noreferrer" download>Download attachment</a>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
