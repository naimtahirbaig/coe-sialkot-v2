'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PublicShell from '@/components/PublicShell';

const CLASS_TABS = [
  { level: 6, label: 'Class 6th' },
  { level: 7, label: 'Class 7th' },
  { level: 8, label: 'Class 8th' },
];

const SUBJECT_COLORS = {
  'Computer Science':    { bg: 'rgba(71,85,105,0.15)',  text: '#94a3b8', border: 'rgba(71,85,105,0.3)'  },
  English:               { bg: 'rgba(217,119,6,0.15)',  text: '#fbbf24', border: 'rgba(217,119,6,0.3)'  },
  'General Science':     { bg: 'rgba(5,150,105,0.15)',  text: '#34d399', border: 'rgba(5,150,105,0.3)'  },
  Science:               { bg: 'rgba(5,150,105,0.15)',  text: '#34d399', border: 'rgba(5,150,105,0.3)'  },
  Geography:             { bg: 'rgba(6,95,70,0.15)',    text: '#6ee7b7', border: 'rgba(6,95,70,0.3)'    },
  History:               { bg: 'rgba(120,53,15,0.15)',  text: '#d97706', border: 'rgba(120,53,15,0.3)'  },
  'History & Geography': { bg: 'rgba(120,53,15,0.15)',  text: '#d97706', border: 'rgba(120,53,15,0.3)'  },
  Islamiat:              { bg: 'rgba(180,83,9,0.15)',   text: '#fb923c', border: 'rgba(180,83,9,0.3)'   },
  Islamiyat:             { bg: 'rgba(180,83,9,0.15)',   text: '#fb923c', border: 'rgba(180,83,9,0.3)'   },
  Mathematics:           { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa', border: 'rgba(37,99,235,0.3)'  },
  'Tarjama-tul-Quran':   { bg: 'rgba(161,98,7,0.15)',   text: '#fde68a', border: 'rgba(161,98,7,0.3)'   },
  'Tarjuma-tul-Quran':   { bg: 'rgba(161,98,7,0.15)',   text: '#fde68a', border: 'rgba(161,98,7,0.3)'   },
  Urdu:                  { bg: 'rgba(8,145,178,0.15)',  text: '#22d3ee', border: 'rgba(8,145,178,0.3)'  },
};

const DEFAULT_COLOR = { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' };

export default function OnlineTestsPage() {
  const [tests, setTests]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeClass, setActiveClass] = useState(6);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('mcq_tests')
        .select('*')
        .eq('is_visible', true)
        .order('class_level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (cancelled) return;
      if (error) setError(error.message);
      else setTests(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = tests.filter((t) => t.class_level === activeClass);
  const countFor = (level) => tests.filter((t) => t.class_level === level).length;

  return (
    <PublicShell>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px 80px' }}>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#e2e8f0', margin: '0 0 8px' }}>
          Online Tests
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 0 28px' }}>
          MCQs Online Tests, September 2026. Choose your class, then your subject.
          No login is needed &mdash; the test opens straight away.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {CLASS_TABS.map((c) => {
            const on = c.level === activeClass;
            return (
              <button
                key={c.level}
                onClick={() => setActiveClass(c.level)}
                style={{
                  padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  fontWeight: on ? 700 : 500,
                  border: `1px solid ${on ? '#C9922A' : '#334155'}`,
                  background: on ? 'rgba(201,146,42,0.15)' : '#1e293b',
                  color: on ? '#fbbf24' : '#e2e8f0',
                  outline: 'none',
                }}
              >
                {c.label}
                {!loading && (
                  <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12 }}>
                    {countFor(c.level)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading && <p style={{ color: '#94a3b8' }}>Loading tests&hellip;</p>}

        {error && (
          <p style={{ color: '#f87171' }}>
            Could not load tests: {error}
          </p>
        )}

        {!loading && !error && visible.length === 0 && (
          <p style={{ color: '#94a3b8' }}>No tests published for this class yet.</p>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 18,
        }}>
          {visible.map((t) => {
            const c = SUBJECT_COLORS[t.subject] || DEFAULT_COLOR;
            return (
              <div
                key={t.id}
                style={{
                  border: '1px solid #334155', borderRadius: 12, background: '#1e293b',
                  padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                }}
              >
                <span style={{
                  alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 999,
                  background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                  fontSize: 12, fontWeight: 600,
                }}>
                  {t.subject}
                </span>

                <h2 style={{
                  margin: 0, fontFamily: 'Georgia, serif', fontSize: 19,
                  color: '#e2e8f0', fontWeight: 700,
                }}>
                  {t.title}
                </h2>

                <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
                  {t.total_mcqs} MCQs &middot; {t.total_marks} marks &middot; {t.secs_per_mcq} sec per question
                </p>

                <a
                  href={t.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginTop: 'auto', textAlign: 'center', padding: '10px 16px',
                    borderRadius: 8, background: '#C9922A', color: '#0E1F3D',
                    fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  }}
                >
                  Start Test
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}
