'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PublicShell from '@/components/PublicShell';

const SUBJECTS = ['All Subjects', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Urdu', 'Pakistan Studies', 'Islamiat', 'Computer'];
const CLASSES  = ['All Classes', '9th', '10th', '11th', '12th'];

export default function PracticeTestsPage() {
  const supabase = createClient();
  const [tests, setTests]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [subject, setSubject]       = useState('All Subjects');
  const [classFilter, setClass]     = useState('All Classes');
  const [activeTest, setActiveTest] = useState(null); // { title, html_content, file_url }

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

  // Subject color palette
  const subjectColor = (s) => {
    const map = {
      Physics: '#7c3aed', Chemistry: '#059669', Biology: '#dc2626',
      Mathematics: '#2563eb', English: '#d97706', Urdu: '#0891b2',
      Computer: '#475569',
    };
    return map[s] || '#64748b';
  };

  return (
    <PublicShell
      title="Practice Tests"
      subtitle="Interactive quizzes and practice tests — sharpen your exam skills"
      accent="#7c3aed"
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 14, color: '#334155', background: '#fff', cursor: 'pointer',
          }}
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>

        <select
          value={classFilter}
          onChange={e => setClass(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 14, color: '#334155', background: '#fff', cursor: 'pointer',
          }}
        >
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Full-screen quiz viewer */}
      {activeTest && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Toolbar */}
          <div style={{
            background: '#1e293b', padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
              🧪 {activeTest.title}
            </span>
            <button
              onClick={() => setActiveTest(null)}
              style={{
                background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                fontWeight: 700, fontSize: 14,
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Iframe / HTML content */}
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              No content available for this test.
            </div>
          )}
        </div>
      )}

      {/* Test cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 16 }}>
          Loading tests...
        </div>
      ) : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧪</div>
          <div style={{ fontSize: 16 }}>No practice tests available yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {tests.map(t => (
            <div
              key={t.id}
              style={{
                background: '#fff', borderRadius: 12, padding: 20,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid #f1f5f9',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              {/* Subject badge + class */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {t.subject && (
                  <span style={{
                    background: subjectColor(t.subject) + '18',
                    color: subjectColor(t.subject),
                    fontSize: 12, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 20,
                  }}>
                    {t.subject}
                  </span>
                )}
                {t.class && (
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                    Class {t.class}
                  </span>
                )}
              </div>

              {/* Title */}
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', lineHeight: 1.4 }}>
                {t.title}
              </div>

              {/* Description */}
              {t.description && (
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  {t.description}
                </div>
              )}

              {/* Date */}
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 'auto' }}>
                Added {new Date(t.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Start button */}
              <button
                onClick={() => setActiveTest(t)}
                style={{
                  background: '#7c3aed', color: '#fff',
                  border: 'none', borderRadius: 8,
                  padding: '10px', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14,
                  marginTop: 4,
                }}
              >
                🚀 Start Test
              </button>
            </div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}
