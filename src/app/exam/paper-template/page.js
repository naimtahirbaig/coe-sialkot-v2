'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import SymbolPicker from '@/components/SymbolPicker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NAVY = '#0E1F3D';
const GOLD = '#C9922A';
const CREAM = '#F5E6C3';
const INK = '#1a1a1a';
const PAPER = '#ffffff';
const LINE = '#e5e0d4';
const SOFT = '#faf7ef';

const CLASSES = ['6th', '7th', '8th'];
const SECTIONS = ['Jinnah', 'Iqbal', 'Sir Syed', 'Liaqat', 'Tipu', 'Babar', 'Abdali'];
const SUBJECTS = [
  'English', 'Urdu', 'Mathematics', 'Science', 'Computer Science',
  'Social Studies', 'Islamiyat', "Tarjuma Tul Qur'an", 'Fine Arts',
];

const SECTION_TYPES = {
  mcq:       { label: 'MCQs',                defaultMarks: 1, defaultCount: 5, defaultInstr: 'Encircle the correct option.' },
  short:     { label: 'Short Questions',     defaultMarks: 2, defaultCount: 5, defaultInstr: 'Answer the following questions briefly.' },
  long:      { label: 'Long Questions',      defaultMarks: 5, defaultCount: 2, defaultInstr: 'Attempt the following questions in detail.' },
  fillblank: { label: 'Fill in the Blanks',  defaultMarks: 1, defaultCount: 5, defaultInstr: 'Fill in the blanks with appropriate words.' },
  truefalse: { label: 'True / False',        defaultMarks: 1, defaultCount: 5, defaultInstr: 'Write T for True and F for False.' },
  match:     { label: 'Match the Columns',   defaultMarks: 1, defaultCount: 5, defaultInstr: 'Match Column A with Column B.' },
};

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now();

const makeDefaultSections = () => [
  {
    id: newId(), type: 'mcq', title: 'MCQs',
    marksPer: 1, instructions: SECTION_TYPES.mcq.defaultInstr,
    questions: Array.from({ length: 5 }, () => ({ id: newId(), text: '', options: ['', '', '', ''] })),
  },
  {
    id: newId(), type: 'short', title: 'Short Questions',
    marksPer: 2, instructions: SECTION_TYPES.short.defaultInstr,
    questions: Array.from({ length: 5 }, () => ({ id: newId(), text: '' })),
  },
  {
    id: newId(), type: 'long', title: 'Long Questions',
    marksPer: 5, instructions: SECTION_TYPES.long.defaultInstr,
    questions: Array.from({ length: 2 }, () => ({ id: newId(), text: '' })),
  },
];

const blankVersion = () => ({ sections: makeDefaultSections() });

function FieldWithSymbols({ as = 'textarea', value, onChange, disabled, style, ...rest }) {
  const ref = useRef(null);
  const Tag = as;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Tag
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={style}
        {...rest}
      />
      {!disabled && (
        <div style={{ display: 'flex' }}>
          <SymbolPicker targetRef={ref} onInsert={onChange} />
        </div>
      )}
    </div>
  );
}

export default function PaperTemplatePage() {
  const [meta, setMeta] = useState({
    schoolName:  'Center of Excellence Sialkot (Boys)',
    testName:    '1st Monthly Test',
    dateRange:   '11 May – 21 May 2026',
    totalMarks:  25,
    timeAllowed: '2 Periods',
    className:   '6th',
    section:     'Jinnah',
    subject:     'English',
    teacherName: '',
  });

  const [versions, setVersions] = useState({ A: blankVersion(), B: blankVersion() });
  const [activeVersion, setActiveVersion] = useState('A');
  const [previewMode, setPreviewMode] = useState(false);

  const [paperId, setPaperId] = useState(null);
  const [status, setStatus] = useState('draft');
  const [submittedAt, setSubmittedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingPaperInfo, setExistingPaperInfo] = useState(null);

  const isLocked = status === 'submitted';
  const current  = versions[activeVersion];

  const showToast = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const detectExisting = useCallback(async () => {
    const { testName, className, section, subject } = meta;
    if (!testName || !className || !section || !subject) {
      setExistingPaperInfo(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('exam_papers')
        .select('id, status, submitted_at, teacher_name, updated_at')
        .eq('test_name', testName)
        .eq('class_name', className)
        .eq('section', section)
        .eq('subject', subject)
        .maybeSingle();
      if (error) throw error;
      setExistingPaperInfo(data || null);
    } catch (err) {
      console.error('Detect failed:', err);
      setExistingPaperInfo(null);
    }
  }, [meta.testName, meta.className, meta.section, meta.subject]);

  const loadExistingPaper = async () => {
    const { testName, className, section, subject } = meta;
    if (!testName || !className || !section || !subject) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_papers')
        .select('*')
        .eq('test_name', testName)
        .eq('class_name', className)
        .eq('section', section)
        .eq('subject', subject)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setPaperId(data.id);
        setStatus(data.status);
        setSubmittedAt(data.submitted_at);
        if (data.meta) setMeta((m) => ({ ...m, ...data.meta }));
        if (data.versions) setVersions(data.versions);
        setExistingPaperInfo(null);
        showToast('success', 'Existing paper loaded.');
      }
    } catch (err) {
      console.error('Load failed:', err);
      showToast('error', 'Could not load paper from server.');
    } finally {
      setLoading(false);
    }
  };

  const dismissExistingBanner = () => {
    setExistingPaperInfo(null);
  };

  useEffect(() => {
    detectExisting();
  }, [meta.testName, meta.className, meta.section, meta.subject]);

  const guardLocked = () => {
    if (isLocked) {
      showToast('error', 'This paper has been submitted and is locked. Ask admin to unlock.');
      return true;
    }
    return false;
  };

  const setCurrentSections = (updater) => {
    if (guardLocked()) return;
    setVersions((prev) => ({
      ...prev,
      [activeVersion]: {
        ...prev[activeVersion],
        sections: typeof updater === 'function' ? updater(prev[activeVersion].sections) : updater,
      },
    }));
  };

  const computeTotal = (sections) =>
    sections.reduce((sum, s) => sum + (Number(s.marksPer) || 0) * s.questions.length, 0);

  const totalA = useMemo(() => computeTotal(versions.A.sections), [versions.A]);
  const totalB = useMemo(() => computeTotal(versions.B.sections), [versions.B]);
  const currentTotal = activeVersion === 'A' ? totalA : totalB;

  const addSection = (type) => {
    if (guardLocked()) return;
    const cfg = SECTION_TYPES[type];
    const newSection = {
      id: newId(), type, title: cfg.label,
      marksPer: cfg.defaultMarks, instructions: cfg.defaultInstr,
      questions: Array.from({ length: cfg.defaultCount }, () => ({
        id: newId(), text: '',
        ...(type === 'mcq' ? { options: ['', '', '', ''] } : {}),
      })),
    };
    setCurrentSections((s) => [...s, newSection]);
  };

  const removeSection = (sid) => {
    if (guardLocked()) return;
    if (!confirm('Remove this section?')) return;
    setCurrentSections((s) => s.filter((x) => x.id !== sid));
  };

  const updateSection = (sid, patch) => setCurrentSections((s) => s.map((x) => (x.id === sid ? { ...x, ...patch } : x)));

  const moveSection = (sid, dir) => {
    setCurrentSections((s) => {
      const idx = s.findIndex((x) => x.id === sid);
      if (idx < 0) return s;
      const next = [...s];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return s;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const addQuestion = (sid) => {
    setCurrentSections((s) => s.map((sec) =>
      sec.id !== sid ? sec : {
        ...sec,
        questions: [
          ...sec.questions,
          { id: newId(), text: '', ...(sec.type === 'mcq' ? { options: ['', '', '', ''] } : {}) },
        ],
      }
    ));
  };

  const removeQuestion = (sid, qid) => {
    setCurrentSections((s) => s.map((sec) =>
      sec.id !== sid ? sec : { ...sec, questions: sec.questions.filter((q) => q.id !== qid) }
    ));
  };

  const updateQuestion = (sid, qid, patch) => {
    setCurrentSections((s) => s.map((sec) =>
      sec.id !== sid ? sec : { ...sec, questions: sec.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)) }
    ));
  };

  const updateOption = (sid, qid, oIdx, val) => {
    setCurrentSections((s) => s.map((sec) =>
      sec.id !== sid ? sec : {
        ...sec,
        questions: sec.questions.map((q) => {
          if (q.id !== qid) return q;
          const options = [...(q.options || ['', '', '', ''])];
          options[oIdx] = val;
          return { ...q, options };
        }),
      }
    ));
  };

  const copyToOther = () => {
    if (guardLocked()) return;
    const other = activeVersion === 'A' ? 'B' : 'A';
    if (!confirm(`Copy Version ${activeVersion} content over Version ${other}?`)) return;
    const cloned = current.sections.map((sec) => ({
      ...sec, id: newId(),
      questions: sec.questions.map((q) => ({
        ...q, id: newId(),
        ...(q.options ? { options: [...q.options] } : {}),
      })),
    }));
    setVersions((prev) => ({ ...prev, [other]: { sections: cloned } }));
  };

  const resetVersion = () => {
    if (guardLocked()) return;
    if (!confirm(`Reset Version ${activeVersion} to default 25-mark structure?`)) return;
    setVersions((prev) => ({ ...prev, [activeVersion]: blankVersion() }));
  };

  const validateBeforeSubmit = () => {
    if (!meta.teacherName.trim()) return 'Please enter the teacher name before submitting.';
    if (totalA !== meta.totalMarks) return `Version A totals ${totalA}, expected ${meta.totalMarks}.`;
    if (totalB !== meta.totalMarks) return `Version B totals ${totalB}, expected ${meta.totalMarks}.`;
    for (const v of ['A', 'B']) {
      const secs = versions[v].sections;
      if (secs.length === 0) return `Version ${v} has no sections.`;
      for (const sec of secs) {
        for (let i = 0; i < sec.questions.length; i++) {
          const q = sec.questions[i];
          if (!q.text || !q.text.trim()) {
            return `Version ${v} → "${sec.title}" → Question ${i + 1} is empty.`;
          }
          if (sec.type === 'mcq') {
            const filled = (q.options || []).filter((o) => o && o.trim()).length;
            if (filled < 2) return `Version ${v} → "${sec.title}" → Question ${i + 1} needs at least 2 options.`;
          }
        }
      }
    }
    return null;
  };

  const buildPayload = (newStatus) => ({
    test_name:    meta.testName,
    date_range:   meta.dateRange,
    class_name:   meta.className,
    section:      meta.section,
    subject:      meta.subject,
    total_marks:  meta.totalMarks,
    time_allowed: meta.timeAllowed,
    teacher_name: meta.teacherName,
    meta,
    versions,
    status: newStatus,
    ...(newStatus === 'submitted' ? { submitted_at: new Date().toISOString() } : {}),
  });

  const saveDraft = async () => {
    if (isLocked) return;
    if (!meta.testName || !meta.className || !meta.section || !meta.subject) {
      showToast('error', 'Fill in test name, class, section, and subject first.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload('draft');
      let res;
      if (paperId) {
        res = await supabase.from('exam_papers').update(payload).eq('id', paperId).select().single();
      } else {
        res = await supabase.from('exam_papers').insert(payload).select().single();
      }
      if (res.error) throw res.error;
      setPaperId(res.data.id);
      setStatus(res.data.status);
      showToast('success', 'Draft saved.');
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Could not save draft.');
    } finally {
      setLoading(false);
    }
  };

  const submitPaper = async () => {
    if (isLocked) return;
    const problem = validateBeforeSubmit();
    if (problem) { showToast('error', problem); return; }
    if (!confirm(
      `Submit this paper to admin?\n\n` +
      `${meta.subject} — Class ${meta.className} (${meta.section})\n` +
      `Both versions total ${meta.totalMarks} marks each.\n\n` +
      `⚠️  Once submitted you cannot edit. Only admin can unlock.`
    )) return;
    setLoading(true);
    try {
      const payload = buildPayload('submitted');
      let res;
      if (paperId) {
        res = await supabase.from('exam_papers').update(payload).eq('id', paperId).select().single();
      } else {
        res = await supabase.from('exam_papers').insert(payload).select().single();
      }
      if (res.error) throw res.error;
      setPaperId(res.data.id);
      setStatus('submitted');
      setSubmittedAt(res.data.submitted_at);
      showToast('success', '✓ Paper submitted to admin. It is now locked.');
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Could not submit paper.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setPreviewMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPreviewMode(false), 300);
    }, 150);
  };

  const s = {
    page: { minHeight: '100vh', background: SOFT, fontFamily: 'system-ui, -apple-system, sans-serif', color: INK },
    topbar: { background: NAVY, color: '#fff', padding: '18px 28px', borderBottom: `4px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
    brand: { display: 'flex', alignItems: 'center', gap: 14 },
    crest: { width: 44, height: 44, borderRadius: '50%', background: GOLD, color: NAVY, display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 18, border: `2px solid ${CREAM}` },
    h1: { margin: 0, fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700 },
    sub: { margin: 0, fontSize: 12, opacity: 0.85, letterSpacing: 0.5 },
    actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    btn: { padding: '9px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3, transition: 'all .15s' },
    btnPrimary: { background: GOLD, color: NAVY },
    btnSubmit:  { background: '#1a7a3e', color: '#fff' },
    btnGhost:   { background: 'transparent', color: '#fff', border: `1px solid ${CREAM}` },
    btnDisabled:{ opacity: 0.5, cursor: 'not-allowed' },
    container: { maxWidth: 1180, margin: '0 auto', padding: '24px 24px 100px' },
    lockBanner: { background: '#fdf6e3', border: `2px solid ${GOLD}`, borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, color: NAVY },
    lockBadge: { width: 48, height: 48, borderRadius: '50%', background: GOLD, color: NAVY, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 },
    card: { background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: 22, marginBottom: 20, boxShadow: '0 1px 2px rgba(14,31,61,.04)' },
    cardTitle: { margin: '0 0 16px', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 10 },
    cardTitleBar: { width: 4, height: 18, background: GOLD, borderRadius: 2 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.7 },
    input: { padding: '9px 12px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 14, background: '#fff', fontFamily: 'inherit', color: INK, outline: 'none' },
    inputLocked: { background: '#f5f0e0', cursor: 'not-allowed', color: '#666' },
    versionTabs: { display: 'flex', gap: 0, marginBottom: 18, borderBottom: `2px solid ${LINE}` },
    tab: { padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: '#6b6b6b', marginBottom: -2, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 8 },
    tabActive: { color: NAVY, borderBottomColor: GOLD },
    tabBadge: { background: CREAM, color: NAVY, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 },
    section: { background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: 20, marginBottom: 14, position: 'relative' },
    sectionLocked: { background: '#fbfaf6' },
    sectionHead: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingBottom: 14, marginBottom: 14, borderBottom: `1px dashed ${LINE}` },
    sectionNumber: { width: 32, height: 32, borderRadius: '50%', background: NAVY, color: GOLD, display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, flexShrink: 0 },
    sectionTitleInput: { flex: 1, minWidth: 180, padding: '7px 10px', border: `1px solid ${LINE}`, borderRadius: 5, fontSize: 15, fontWeight: 600, color: NAVY, fontFamily: 'inherit', background: SOFT },
    miniInput: { width: 65, padding: '7px 10px', border: `1px solid ${LINE}`, borderRadius: 5, fontSize: 13, textAlign: 'center', fontFamily: 'inherit' },
    typeSelect: { padding: '7px 10px', border: `1px solid ${LINE}`, borderRadius: 5, fontSize: 13, background: '#fff', fontFamily: 'inherit', cursor: 'pointer' },
    iconBtn: { width: 30, height: 30, borderRadius: 5, border: `1px solid ${LINE}`, background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 14, color: NAVY },
    iconBtnDanger: { color: '#b00020', borderColor: '#f5c6cb' },
    instr: { width: '100%', padding: '7px 10px', border: `1px solid ${LINE}`, borderRadius: 5, fontSize: 13, fontStyle: 'italic', color: '#555', fontFamily: 'inherit', marginBottom: 12, background: SOFT },
    qRow: { display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
    qNum: { flexShrink: 0, width: 28, padding: '8px 0', textAlign: 'center', fontWeight: 700, color: NAVY, fontSize: 14 },
    qBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
    qInput: { width: '100%', padding: '8px 12px', border: `1px solid ${LINE}`, borderRadius: 5, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 38 },
    optGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, paddingLeft: 8 },
    optInput: { padding: '6px 10px', border: `1px solid ${LINE}`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit' },
    addRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${LINE}` },
    addBtn: { padding: '8px 14px', borderRadius: 5, border: `1px dashed ${NAVY}`, background: 'transparent', color: NAVY, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' },
    addSectionRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 16, background: '#fff', border: `2px dashed ${GOLD}`, borderRadius: 10, marginTop: 8 },
    addSecLabel: { fontSize: 13, fontWeight: 700, color: NAVY, marginRight: 4 },
    summaryBar: { position: 'sticky', bottom: 16, background: NAVY, color: '#fff', padding: '14px 22px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 24, boxShadow: '0 8px 24px rgba(14,31,61,.25)', border: `2px solid ${GOLD}` },
    summaryNum: { fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: GOLD },
    toast: { position: 'fixed', top: 90, right: 20, zIndex: 100, padding: '12px 20px', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 20px rgba(0,0,0,.18)', maxWidth: 380 },
    paperSheet: { background: '#fff', maxWidth: 800, margin: '0 auto', padding: '28px 36px', boxShadow: '0 0 0 1px rgba(0,0,0,.06), 0 30px 60px rgba(14,31,61,.12)', color: '#000', fontFamily: '"Times New Roman", Times, serif', fontSize: 12, lineHeight: 1.4 },
    versionBlock: { position: 'relative', paddingBottom: 14, marginBottom: 14 },
    versionDivider: { borderTop: `2px dashed ${INK}`, margin: '16px 0', textAlign: 'center', position: 'relative' },
    versionDividerLabel: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#666' },
    paperHead: { textAlign: 'center', borderBottom: `2px solid ${INK}`, paddingBottom: 8, marginBottom: 10 },
    paperSchool: { fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 },
    paperTest: { fontSize: 11, fontWeight: 600, marginTop: 2, fontStyle: 'italic' },
    metaRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 11, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${INK}` },
    metaCell: { display: 'flex', gap: 4 },
    metaLabel: { fontWeight: 700 },
    versionStamp: { display: 'inline-block', border: `2px solid ${GOLD}`, color: NAVY, padding: '2px 10px', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 11, background: '#fff', letterSpacing: 1, marginBottom: 6 },
    pSection: { marginTop: 8 },
    pSectionTitle: { fontFamily: 'Georgia, serif', fontSize: 12.5, fontWeight: 700, color: NAVY, margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${GOLD}`, paddingBottom: 2 },
    pSectionMarks: { fontSize: 10, color: '#444', fontWeight: 600 },
    pInstr: { fontStyle: 'italic', fontSize: 10.5, marginTop: 2, marginBottom: 4, color: '#444' },
    pQuestion: { display: 'flex', gap: 6, marginBottom: 3 },
    pQNum: { fontWeight: 700, minWidth: 20, fontSize: 11.5 },
    pQText: { flex: 1, fontSize: 11.5 },
  };

  const lockedInputStyle = isLocked ? { ...s.input, ...s.inputLocked } : s.input;

  const renderVersionBlock = (versionKey, isLast) => {
    const ver = versions[versionKey];
    return (
      <div key={versionKey} style={s.versionBlock} className="version-block">
        <div style={s.paperHead}>
          <div style={s.versionStamp}>VERSION {versionKey}</div>
          <h1 style={s.paperSchool}>{meta.schoolName}</h1>
          <div style={s.paperTest}>{meta.testName} &nbsp;•&nbsp; {meta.dateRange}</div>
          <div style={s.metaRow}>
            <div style={s.metaCell}><span style={s.metaLabel}>Class:</span> {meta.className} ({meta.section})</div>
            <div style={s.metaCell}><span style={s.metaLabel}>Subject:</span> {meta.subject}</div>
            <div style={s.metaCell}><span style={s.metaLabel}>Time:</span> {meta.timeAllowed}</div>
            <div style={s.metaCell}><span style={s.metaLabel}>Total Marks:</span> {meta.totalMarks}</div>
          </div>
        </div>
        {ver.sections.map((sec, i) => {
          const sMarks = (Number(sec.marksPer) || 0) * sec.questions.length;
          return (
            <div key={sec.id} style={s.pSection} className="paper-section">
              <h2 style={s.pSectionTitle}>
                <span>Section {ROMANS[i] || i + 1}: {sec.title || SECTION_TYPES[sec.type]?.label}</span>
                <span style={s.pSectionMarks}>({sec.questions.length} × {sec.marksPer} = {sMarks})</span>
              </h2>
              {sec.instructions && <div style={s.pInstr}>{sec.instructions}</div>}
              {sec.questions.map((q, qi) => {
                if (sec.type === 'mcq') {
                  return (
                    <div key={q.id} style={{ marginBottom: 4 }}>
                      <div style={s.pQuestion}>
                        <span style={s.pQNum}>{qi + 1}.</span>
                        <span style={s.pQText}>{q.text || '________________________'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 12px', paddingLeft: 26, fontSize: 10.5 }}>
                        {(q.options || ['', '', '', '']).map((opt, oi) => (
                          <div key={oi}>
                            <span style={{ fontWeight: 600 }}>({String.fromCharCode(97 + oi)})</span> {opt || '____'}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={q.id} style={s.pQuestion}>
                    <span style={s.pQNum}>{qi + 1}.</span>
                    <span style={s.pQText}>{q.text || '____________________________________________'}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
        {!isLast && (
          <div style={s.versionDivider}>
            <span style={s.versionDividerLabel}>END OF VERSION {versionKey}</span>
          </div>
        )}
      </div>
    );
  };

  const toastBg = toast?.kind === 'success' ? '#1a7a3e' : toast?.kind === 'error' ? '#b00020' : NAVY;

  return (
    <div style={s.page}>
      <style>{`
        input:focus, textarea:focus, select:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(201,146,42,.15); }
        button:hover:not(:disabled) { filter: brightness(1.05); }
        .paper-section { page-break-inside: avoid; }
        .version-block { page-break-inside: avoid; }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-area { background: #fff !important; padding: 0 !important; }
          .paper-sheet { box-shadow: none !important; margin: 0 auto !important; padding: 12mm 14mm !important; max-width: 100% !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
      {toast && (
        <div className="no-print" style={{ ...s.toast, background: toastBg }}>{toast.msg}</div>
      )}
      <div className="no-print" style={s.topbar}>
        <div style={s.brand}>
          <div style={s.crest}>COE</div>
          <div>
            <h1 style={s.h1}>Paper Template Builder</h1>
            <p style={s.sub}>Center of Excellence Sialkot (Boys) — Examination Portal</p>
          </div>
        </div>
        <div style={s.actions}>
          <button style={{ ...s.btn, ...s.btnGhost, ...((isLocked || loading) ? s.btnDisabled : {}) }} onClick={resetVersion} disabled={isLocked || loading}>↺ Reset Version</button>
          <button style={{ ...s.btn, ...s.btnGhost, ...((isLocked || loading) ? s.btnDisabled : {}) }} onClick={copyToOther} disabled={isLocked || loading}>⧉ Copy to Other Version</button>
          <button style={{ ...s.btn, ...s.btnGhost, ...(loading ? s.btnDisabled : {}) }} onClick={handlePrint} disabled={loading}>⎙ Print Paper</button>
          {!isLocked && (<button style={{ ...s.btn, ...s.btnGhost, ...(loading ? s.btnDisabled : {}) }} onClick={saveDraft} disabled={loading}>💾 Save Draft</button>)}
          {!isLocked && (<button style={{ ...s.btn, ...s.btnSubmit, ...(loading ? s.btnDisabled : {}) }} onClick={submitPaper} disabled={loading}>✓ Submit to Admin</button>)}
        </div>
      </div>
      <div className="print-area">
        <div className="no-print" style={s.container}>
          {isLocked && (
            <div style={s.lockBanner}>
              <div style={s.lockBadge}>🔒</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Paper Submitted &amp; Locked</div>
                <div style={{ fontSize: 13, color: '#555' }}>Submitted on {submittedAt ? new Date(submittedAt).toLocaleString() : '—'}. This paper is now read-only. Contact admin if changes are needed.</div>
              </div>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handlePrint}>⎙ Print</button>
            </div>
          )}
          {!isLocked && existingPaperInfo && !paperId && (
            <div style={{ background: '#fff8e1', border: `2px solid ${GOLD}`, borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, color: NAVY }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: GOLD, color: NAVY, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>📂</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>An existing paper was found for this combination</div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  {meta.subject} · Class {meta.className} ({meta.section}) ·
                  {' '}{existingPaperInfo.status === 'submitted' ? '🔒 Submitted' : '✎ Draft'}
                  {existingPaperInfo.teacher_name && ` by ${existingPaperInfo.teacher_name}`} ·
                  Last updated {new Date(existingPaperInfo.updated_at).toLocaleString()}
                </div>
              </div>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={loadExistingPaper} disabled={loading}>📂 Load It</button>
              <button style={{ ...s.btn, background: 'transparent', color: NAVY, border: `1px solid ${NAVY}` }} onClick={dismissExistingBanner}>Start Fresh</button>
            </div>
          )}
          <div style={s.card}>
            <h2 style={s.cardTitle}><span style={s.cardTitleBar} />Paper Information</h2>
            <div style={s.grid}>
              <div style={s.field}><label style={s.label}>Test Name</label><input style={lockedInputStyle} disabled={isLocked} value={meta.testName} onChange={(e) => setMeta({ ...meta, testName: e.target.value })} /></div>
              <div style={s.field}><label style={s.label}>Date Range</label><input style={lockedInputStyle} disabled={isLocked} value={meta.dateRange} onChange={(e) => setMeta({ ...meta, dateRange: e.target.value })} /></div>
              <div style={s.field}><label style={s.label}>Class</label><select style={lockedInputStyle} disabled={isLocked} value={meta.className} onChange={(e) => setMeta({ ...meta, className: e.target.value })}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div style={s.field}><label style={s.label}>Section</label><select style={lockedInputStyle} disabled={isLocked} value={meta.section} onChange={(e) => setMeta({ ...meta, section: e.target.value })}>{SECTIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div style={s.field}><label style={s.label}>Subject</label><select style={lockedInputStyle} disabled={isLocked} value={meta.subject} onChange={(e) => setMeta({ ...meta, subject: e.target.value })}>{SUBJECTS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div style={s.field}><label style={s.label}>Total Marks</label><input type="number" style={lockedInputStyle} disabled={isLocked} value={meta.totalMarks} onChange={(e) => setMeta({ ...meta, totalMarks: Number(e.target.value) })} /></div>
              <div style={s.field}><label style={s.label}>Time Allowed</label><input style={lockedInputStyle} disabled={isLocked} value={meta.timeAllowed} onChange={(e) => setMeta({ ...meta, timeAllowed: e.target.value })} /></div>
              <div style={s.field}><label style={s.label}>Teacher Name *</label><input style={lockedInputStyle} disabled={isLocked} value={meta.teacherName} onChange={(e) => setMeta({ ...meta, teacherName: e.target.value })} placeholder="Required for submission" /></div>
            </div>
          </div>
          <div style={s.versionTabs}>
            {['A', 'B'].map((v) => (
              <button key={v} onClick={() => setActiveVersion(v)} style={{ ...s.tab, ...(activeVersion === v ? s.tabActive : {}) }}>
                Version {v}
                <span style={s.tabBadge}>{(v === 'A' ? totalA : totalB)} / {meta.totalMarks}</span>
              </button>
            ))}
          </div>
          <div>
            {current.sections.length === 0 && (<div style={{ ...s.card, textAlign: 'center', color: '#888', padding: 40 }}>No sections yet. Add one below.</div>)}
            {current.sections.map((sec, i) => (
              <div key={sec.id} style={{ ...s.section, ...(isLocked ? s.sectionLocked : {}) }}>
                <div style={s.sectionHead}>
                  <div style={s.sectionNumber}>{ROMANS[i] || i + 1}</div>
                  <input style={{ ...s.sectionTitleInput, ...(isLocked ? s.inputLocked : {}) }} disabled={isLocked} value={sec.title} onChange={(e) => updateSection(sec.id, { title: e.target.value })} placeholder="Section title" />
                  <select style={{ ...s.typeSelect, ...(isLocked ? s.inputLocked : {}) }} disabled={isLocked} value={sec.type} onChange={(e) => updateSection(sec.id, { type: e.target.value })}>
                    {Object.entries(SECTION_TYPES).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <input type="number" style={{ ...s.miniInput, ...(isLocked ? s.inputLocked : {}) }} disabled={isLocked} value={sec.marksPer} min={0} onChange={(e) => updateSection(sec.id, { marksPer: Number(e.target.value) })} />
                    <span style={{ color: '#666' }}>× {sec.questions.length} = </span>
                    <strong style={{ color: NAVY }}>{(Number(sec.marksPer) || 0) * sec.questions.length}</strong>
                  </div>
                  {!isLocked && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                      <button style={s.iconBtn} onClick={() => moveSection(sec.id, -1)} title="Move up">↑</button>
                      <button style={s.iconBtn} onClick={() => moveSection(sec.id, 1)} title="Move down">↓</button>
                      <button style={{ ...s.iconBtn, ...s.iconBtnDanger }} onClick={() => removeSection(sec.id)} title="Remove section">✕</button>
                    </div>
                  )}
                </div>
                <input style={{ ...s.instr, ...(isLocked ? s.inputLocked : {}) }} disabled={isLocked} value={sec.instructions} onChange={(e) => updateSection(sec.id, { instructions: e.target.value })} placeholder="Instructions" />
                {sec.questions.map((q, qi) => (
                  <div key={q.id} style={s.qRow}>
                    <div style={s.qNum}>{qi + 1}.</div>
                    <div style={s.qBody}>
                      <FieldWithSymbols
                        as="textarea"
                        style={{ ...s.qInput, ...(isLocked ? s.inputLocked : {}) }}
                        disabled={isLocked}
                        value={q.text}
                        onChange={(val) => updateQuestion(sec.id, q.id, { text: val })}
                        placeholder={sec.type === 'mcq' ? 'Question stem…' : sec.type === 'fillblank' ? 'Sentence with ______ blank…' : sec.type === 'truefalse' ? 'Statement to mark T/F…' : sec.type === 'match' ? 'Item A — pair to match…' : 'Question text…'}
                        rows={sec.type === 'long' ? 2 : 1}
                      />
                      {sec.type === 'mcq' && (
                        <div style={s.optGrid}>
                          {(q.options || ['', '', '', '']).map((opt, oi) => (
                            <FieldWithSymbols
                              key={oi}
                              as="input"
                              style={{ ...s.optInput, ...(isLocked ? s.inputLocked : {}) }}
                              disabled={isLocked}
                              value={opt}
                              onChange={(val) => updateOption(sec.id, q.id, oi, val)}
                              placeholder={`Option (${String.fromCharCode(97 + oi)})`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {!isLocked && (<button style={{ ...s.iconBtn, ...s.iconBtnDanger }} onClick={() => removeQuestion(sec.id, q.id)} title="Remove question">−</button>)}
                  </div>
                ))}
                {!isLocked && (<div style={s.addRow}><button style={s.addBtn} onClick={() => addQuestion(sec.id)}>+ Add Question</button></div>)}
              </div>
            ))}
          </div>
          {!isLocked && (
            <div style={s.addSectionRow}>
              <span style={s.addSecLabel}>+ Add Section:</span>
              {Object.entries(SECTION_TYPES).map(([k, v]) => (<button key={k} style={s.addBtn} onClick={() => addSection(k)}>{v.label}</button>))}
            </div>
          )}
          <div style={s.summaryBar}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>Version {activeVersion} Total {isLocked && '— LOCKED'}</div>
              <div style={s.summaryNum}>{currentTotal} / {meta.totalMarks} marks</div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Version A: <strong style={{ color: GOLD }}>{totalA}</strong> &nbsp;•&nbsp; Version B: <strong style={{ color: GOLD }}>{totalB}</strong></div>
            {currentTotal !== meta.totalMarks && !isLocked && (
              <div style={{ background: currentTotal > meta.totalMarks ? '#7a1a1a' : '#7a5a1a', padding: '6px 12px', borderRadius: 5, fontSize: 12, fontWeight: 600 }}>
                {currentTotal > meta.totalMarks ? 'Over' : 'Under'} target by {Math.abs(currentTotal - meta.totalMarks)}
              </div>
            )}
            {!isLocked && (<button style={{ ...s.btn, ...s.btnSubmit, ...(loading ? s.btnDisabled : {}) }} onClick={submitPaper} disabled={loading}>{loading ? 'Submitting…' : '✓ Submit Paper to Admin'}</button>)}
          </div>
        </div>
        <div className={previewMode ? '' : 'no-print'} style={{ padding: previewMode ? '32px 0' : 0 }}>
          {previewMode && (<div style={{ textAlign: 'center', marginBottom: 20, fontSize: 13, color: '#666' }} className="no-print">Preparing print preview…</div>)}
          <div className="paper-sheet" style={s.paperSheet}>
            {renderVersionBlock('A', false)}
            {renderVersionBlock('B', true)}
          </div>
        </div>
      </div>
    </div>
  );
}
