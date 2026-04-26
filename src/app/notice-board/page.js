'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PublicShell from '@/components/PublicShell';

export default function NoticeBoardPage() {
  const [notices, setNotices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function fetchNotices() {
      const { data } = await supabase
        .from('public_notices')
        .select('*')
        .eq('is_visible', true)
        .order('is_pinned', { ascending: false })
        .order('notice_date', { ascending: false });
      setNotices(data || []);
      setLoading(false);
    }
    fetchNotices();
  }, []);

  const pinned   = notices.filter(n => n.is_pinned);
  const regular  = notices.filter(n => !n.is_pinned);

  return (
    <PublicShell
      title="Notice Board"
      subtitle="Official announcements and notices from the school administration"
      accent="#f87171"
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              background: '#1e293b', borderRadius: 12,
              border: '1px solid #334155', height: 72,
            }} />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>No notices posted yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Pinned notices */}
          {pinned.length > 0 && (
            <div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#f59e0b',
                letterSpacing: '0.08em', marginBottom: 10,
              }}>
                📌 PINNED
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pinned.map(n => <NoticeCard key={n.id} notice={n} expanded={expanded} setExpanded={setExpanded} />)}
              </div>
            </div>
          )}

          {/* Regular notices */}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#64748b',
                  letterSpacing: '0.08em', marginBottom: 10,
                }}>
                  ALL NOTICES
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {regular.map(n => <NoticeCard key={n.id} notice={n} expanded={expanded} setExpanded={setExpanded} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </PublicShell>
  );
}

function NoticeCard({ notice: n, expanded, setExpanded }) {
  const isOpen = expanded === n.id;

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 12,
      border: n.is_pinned ? '1px solid rgba(245,158,11,0.4)' : '1px solid #334155',
      overflow: 'hidden',
      boxShadow: n.is_pinned ? '0 0 0 1px rgba(245,158,11,0.1)' : 'none',
    }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: n.body ? 'pointer' : 'default',
          background: n.is_pinned ? 'rgba(245,158,11,0.05)' : 'transparent',
        }}
        onClick={() => n.body && setExpanded(isOpen ? null : n.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          {/* Date block */}
          <div style={{
            background: '#0f172a', borderRadius: 8, padding: '6px 12px',
            textAlign: 'center', flexShrink: 0, border: '1px solid #334155',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
              {new Date(n.notice_date).getDate()}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginTop: 2 }}>
              {new Date(n.notice_date).toLocaleDateString('en-PK', { month: 'short' }).toUpperCase()}
            </div>
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 15, color: '#f1f5f9',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {n.is_pinned && <span style={{ marginRight: 6 }}>📌</span>}
              {n.title}
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
              {new Date(n.notice_date).toLocaleDateString('en-PK', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
          {n.file_url && (
            <a
              href={n.file_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={e => e.stopPropagation()}
              style={{
                background: '#f59e0b', color: '#0f172a',
                padding: '6px 14px', borderRadius: 8,
                fontSize: 12, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              ⬇ Attachment
            </a>
          )}
          {n.body && (
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#0f172a', border: '1px solid #334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', fontSize: 12,
            }}>
              {isOpen ? '▲' : '▼'}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {isOpen && n.body && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #334155',
          fontSize: 14, color: '#94a3b8',
          lineHeight: 1.7, whiteSpace: 'pre-wrap',
        }}>
          {n.body}
        </div>
      )}
    </div>
  );
}
