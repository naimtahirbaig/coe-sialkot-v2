'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PublicShell from '@/components/PublicShell';

const SUBJECTS = ['All Subjects', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Urdu', 'Pakistan Studies', 'Islamiat', 'Computer'];
const CLASSES  = ['All Classes', '9th', '10th', '11th', '12th'];

const SUBJECT_COLORS = {
  Physics:          { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
  Chemistry:        { bg: 'rgba(5,150,105,0.15)',  text: '#34d399', border: 'rgba(5,150,105,0.3)'  },
  Biology:          { bg: 'rgba(220,38,38,0.15)',  text: '#f87171', border: 'rgba(220,38,38,0.3)'  },
  Mathematics:      { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa', border: 'rgba(37,99,235,0.3)'  },
  English:          { bg: 'rgba(217,119,6,0.15)',  text: '#fbbf24', border: 'rgba(217,119,6,0.3)'  },
  Urdu:             { bg: 'rgba(8,145,178,0.15)',  text: '#22d3ee', border: 'rgba(8,145,178,0.3)'  },
  Computer:         { bg: 'rgba(71,85,105,0.15)',  text: '#94a3b8', border: 'rgba(71,85,105,0.3)'  },
};

export default function PracticeTestsPage() {
  const [tests, setTests]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [subject, setSubject]       = useState('All Subjects');
  const [classFilter, setClass]     = useState('All Classes');
  const [activeTest, setActiveTest] = useState(null);

  useEffect(() => {
    async function fetchTests() {
      let query = supabase
        .from('public_practice_tests')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (subject !== 'All Subjects') query = query.eq('subject', subject);
      if (classFilter !== 'All Classes') query = query.or(`class.eq.${classFilter},class.eq.All`);

      const { data } = await query;
      setTests(data || []);
      setLoading(false);
    }
    fetchTests();
  }, [subject, classFilter]);

  return (
    <PublicShell
      title="Practice Tests"
      subtitle="Interactive quizzes and practice tests — sharpen your exam skills"
      accent="#a78bfa"
    >

      {/* ── Full-screen Quiz Viewer ── */}
      {activeTest && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: '#0f172a',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Toolbar */}
          <div style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🧪</span>
              <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>
                {activeTest.title}
              </span>
              {activeTest.subject && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: 'rgba(167,139,250,0.15)',
                  color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)',
                  padding: '2px 10px', borderRadius: 20,
                }}>
                  {activeTest.subject}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTest(null)}
              style={{
                background: '#334155', color: '#f1f5f9', border: 'none',
                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                fontWeight: 700, fontSize: 13,
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Content */}
          {activeTest.file_url ? (
            <iframe
              src={activeTest.file_url}
              style={{ flex: 1, border: 'none', background: '#fff' }}
              title={activeTest.title}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : activeTest.html_content ? (
            <iframe
              srcDoc={activeTest.html_content}
              style={{ flex: 1, border: 'none', background: '#fff' }}
              title={activeTest.title}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', fontSize: 16,
            }}>
              No content available for this test.
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid #334155', background: '#1e293b',
            color: '#e2e8f0', fontSize: 13, cursor: 'pointer', outline: 'none',
          }}
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>

        <select
          value={classFilter}
          onChange={e => setClass(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid #334155', background: '#1e293b',
            color: '#e2e8f0', fontSize: 13, cursor: 'pointer', outline: 'none',
          }}
        >
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Count ── */}
      {!loading && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          {tests.length} {tests.length === 1 ? 'test' : 'tests'} available
        </div>
      )}

      {/* ── Cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', height: 180 }} />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🧪</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>No practice tests available yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {tests.map(t => {
            const colors = SUBJECT_COLORS[t.subject] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' };
            return (
              <div key={t.id} style={{
                background: '#1e293b', borderRadius: 12,
                border: '1px solid #334155', padding: 20,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {/* Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {t.subject ? (
                    <span style={{
                      background: colors.bg, color: colors.text,
                      border: `1px solid ${colors.border}`,
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    }}>
                      {t.subject}
                    </span>
                  ) : <span />}
                  {t.class && (
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      Class {t.class}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', lineHeight: 1.4 }}>
                  {t.title}
                </div>

                {/* Description */}
                {t.description && (
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                    {t.description}
                  </div>
                )}

                {/* Date */}
                <div style={{ fontSize: 12, color: '#475569', marginTop: 'auto' }}>
                  Added {new Date(t.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* CTA */}
                <button
                  onClick={() => setActiveTest(t)}
                  style={{
                    background: '#f59e0b', color: '#0f172a',
                    border: 'none', borderRadius: 8, padding: '10px',
                    cursor: 'pointer', fontWeight: 800, fontSize: 14,
                  }}
                >
                  🚀 Start Test
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PublicShell>
  );
}
