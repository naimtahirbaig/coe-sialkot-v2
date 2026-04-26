'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PublicShell from '@/components/PublicShell';

const CLASSES = ['All Classes', '6th', '7th', '8th', '9th', '10th'];

const SUBJECTS = [
  'All Subjects',
  'Physics', 'Chemistry', 'Biology', 'Mathematics',
  'English', 'Urdu', 'Pakistan Studies', 'Islamiat',
  'Computer', "Tarjuma Tul Qur'an", 'Fine Arts', 'History', 'Geography',
];

const SUBJECT_COLORS = {
  Physics:              { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
  Chemistry:            { bg: 'rgba(5,150,105,0.15)',  text: '#34d399', border: 'rgba(5,150,105,0.3)'  },
  Biology:              { bg: 'rgba(220,38,38,0.15)',  text: '#f87171', border: 'rgba(220,38,38,0.3)'  },
  Mathematics:          { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa', border: 'rgba(37,99,235,0.3)'  },
  English:              { bg: 'rgba(217,119,6,0.15)',  text: '#fbbf24', border: 'rgba(217,119,6,0.3)'  },
  Urdu:                 { bg: 'rgba(8,145,178,0.15)',  text: '#22d3ee', border: 'rgba(8,145,178,0.3)'  },
  Computer:             { bg: 'rgba(71,85,105,0.15)',  text: '#94a3b8', border: 'rgba(71,85,105,0.3)'  },
  'Pakistan Studies':   { bg: 'rgba(22,163,74,0.15)', text: '#4ade80', border: 'rgba(22,163,74,0.3)'  },
  Islamiat:             { bg: 'rgba(180,83,9,0.15)',   text: '#fb923c', border: 'rgba(180,83,9,0.3)'   },
  "Tarjuma Tul Qur'an": { bg: 'rgba(161,98,7,0.15)',  text: '#fde68a', border: 'rgba(161,98,7,0.3)'   },
  'Fine Arts':          { bg: 'rgba(219,39,119,0.15)',text: '#f472b6', border: 'rgba(219,39,119,0.3)'  },
  History:              { bg: 'rgba(120,53,15,0.15)', text: '#d97706', border: 'rgba(120,53,15,0.3)'   },
  Geography:            { bg: 'rgba(6,95,70,0.15)',   text: '#6ee7b7', border: 'rgba(6,95,70,0.3)'    },
};

const DEFAULT_COLOR = { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' };

const selectStyle = {
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid #334155', background: '#1e293b',
  color: '#e2e8f0', fontSize: 13, cursor: 'pointer', outline: 'none',
};

export default function PracticeTestsPage() {
  const [tests, setTests]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [subject, setSubject]       = useState('All Subjects');
  const [classFilter, setClass]     = useState('All Classes');

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
      title="🧪 Practice Tests"
      subtitle="Interactive quizzes and practice tests — sharpen your exam skills"
      accent="#a78bfa"
    >

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={classFilter} onChange={e => setClass(e.target.value)} style={selectStyle}>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {!loading && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          {tests.length} {tests.length === 1 ? 'test' : 'tests'} available
        </div>
      )}

      {/* ── Cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', height: 200 }} />
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
            const colors = SUBJECT_COLORS[t.subject] || DEFAULT_COLOR;
            return (
              <div key={t.id} style={{
                background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
                padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {t.subject ? (
                    <span style={{
                      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    }}>{t.subject}</span>
                  ) : <span />}
                  {t.class && <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Class {t.class}</span>}
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', lineHeight: 1.4 }}>{t.title}</div>

                {t.description && (
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{t.description}</div>
                )}

                <div style={{ fontSize: 12, color: '#475569', marginTop: 'auto' }}>
                  Added {new Date(t.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                <a
                  href={t.file_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    background: '#f59e0b', color: '#0f172a',
                    border: 'none', borderRadius: 8,
                    padding: '10px', cursor: 'pointer',
                    fontWeight: 800, fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  🚀 Start Test
                </a>
              </div>
            );
          })}
        </div>
      )}
    </PublicShell>
  );
}
