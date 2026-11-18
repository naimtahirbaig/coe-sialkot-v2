'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import InnerPage from '@/components/site/InnerPage';

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
    <InnerPage section="students" title="September" light="MCQ Tests" short crumb="MCQ Tests, September 2026"
      lede="The September 2026 MCQ tests. Choose your class, then your subject; no sign-in is needed.">
      <div className="ip-box ot-note">The new chapter-wise tests for 2026 are on <a href="/online-tests-2026.html">Online Tests 2026</a>, and you can practise them on <a href="/practice-tests-2026.html">Practice Tests</a>.</div>
      <div className="ip-seg" role="group" aria-label="Class">
        {CLASS_TABS.map((c) => (
          <button key={c.level} type="button" aria-pressed={c.level === activeClass} onClick={() => setActiveClass(c.level)}>
            {c.label}{!loading && ` (${countFor(c.level)})`}
          </button>
        ))}
      </div>
      {loading && <p className="ip-empty">Loading tests…</p>}
      {error && <p className="ip-err">Could not load the tests: {error}</p>}
      {!loading && !error && visible.length === 0 && <p className="ip-empty">No tests are published for this class yet.</p>}
      <div className="ip-cards ot-cards">
        {visible.map((t) => (
          <article key={t.id} className="ip-card sr-card">
            <span className="ip-tag gold" style={{ alignSelf: 'flex-start' }}>{t.subject}</span>
            <h3>{t.title}</h3>
            <p className="sr-desc">{t.total_mcqs} MCQs, {t.total_marks} marks, {t.secs_per_mcq} seconds per question</p>
            <div className="sr-actions" style={{ marginTop: 'auto' }}><a className="ip-btn" href={t.file_url} target="_blank" rel="noreferrer">Start test</a></div>
          </article>
        ))}
      </div>
    </InnerPage>
  );
}
