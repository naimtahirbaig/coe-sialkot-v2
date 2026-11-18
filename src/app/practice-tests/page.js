'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import InnerPage from '@/components/site/InnerPage';

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
    <InnerPage section="students" title="Practice" light="Quizzes" short
      lede="Quizzes and practice papers added by teachers. For chapter-wise MCQ practice, use Practice Tests."
      toc={[{ id: 'chapter', label: 'Chapter-wise practice' }, { id: 'quizzes', label: 'Quizzes' }]}>
      <section id="chapter">
        <h2>Chapter-wise practice</h2>
        <div className="pq-feature">
          <div>
            <p className="ip-lede">Every chapter of every subject for Classes 6, 7 and 8, with the same questions and timer as the online tests.</p>
            <p>No camera, nothing saved. Practise as many times as you like.</p>
          </div>
          <a className="ip-btn" href="/practice-tests-2026.html">Start practising</a>
        </div>
      </section>
      <hr className="ip-rule" />
      <section id="quizzes">
        <h2>Quizzes</h2>
        <div className="sr-filters">
          <label>Subject<select className="ip-field" value={subject} onChange={e => setSubject(e.target.value)}>{SUBJECTS.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Class<select className="ip-field" value={classFilter} onChange={e => setClass(e.target.value)}>{CLASSES.map(c => <option key={c}>{c}</option>)}</select></label>
        </div>
        {loading ? <p className="ip-empty">Loading…</p> : tests.length === 0 ? (
          <p className="ip-empty">No quizzes for this choice yet. The chapter-wise practice tests above cover every subject.</p>
        ) : (
          <div className="ip-cards ot-cards">
            {tests.map(t => (
              <article key={t.id} className="ip-card sr-card">
                <div className="sr-top">{t.subject ? <span className="ip-tag gold">{t.subject}</span> : <span />}{t.class && <span className="sr-class">Class {t.class}</span>}</div>
                <h3>{t.title}</h3>
                {t.description && <p className="sr-desc">{t.description}</p>}
                <p className="sr-meta">Added {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <div className="sr-actions"><a className="ip-btn" href={t.file_url || '#'} target="_blank" rel="noopener noreferrer">Start quiz</a></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </InnerPage>
  );
}
