'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PublicShell from '@/components/PublicShell';

export default function NoticeBoardPage() {
  const supabase = createClient();
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

  return (
    <PublicShell
      title="Notice Board"
      subtitle="Official announcements and notices from the school administration"
      accent="#dc2626"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 16 }}>
          Loading notices...
        </div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16 }}>No notices posted yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notices.map(n => (
            <div
              key={n.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: n.is_pinned ? '2px solid #fbbf24' : '1px solid #f1f5f9',
                boxShadow: n.is_pinned
                  ? '0 2px 12px rgba(251,191,36,0.15)'
                  : '0 1px 4px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: n.body ? 'pointer' : 'default',
                  background: n.is_pinned ? '#fffbeb' : '#fff',
                }}
                onClick={() => n.body && setExpanded(expanded === n.id ? null : n.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {n.is_pinned && (
                    <span style={{ fontSize: 18 }} title="Pinned">📌</span>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(n.notice_date).toLocaleDateString('en-PK', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {n.file_url && (
                    <a
                      href={n.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      onClick={e => e.stopPropagation()}
                      style={{
                        background: '#dc2626', color: '#fff',
                        padding: '6px 14px', borderRadius: 8,
                        fontSize: 13, fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      ⬇ Attachment
                    </a>
                  )}
                  {n.body && (
                    <span style={{ fontSize: 20, color: '#94a3b8', userSelect: 'none' }}>
                      {expanded === n.id ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </div>

              {/* Expandable body */}
              {expanded === n.id && n.body && (
                <div style={{
                  padding: '0 20px 20px',
                  fontSize: 15, color: '#334155', lineHeight: 1.7,
                  borderTop: '1px solid #f1f5f9',
                  whiteSpace: 'pre-wrap',
                }}>
                  {n.body}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}
