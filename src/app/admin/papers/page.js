'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminAuth from '@/components/AdminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NAVY = '#0E1F3D';
const GOLD = '#C9922A';
const CREAM = '#F5E6C3';
const INK  = '#1a1a1a';
const LINE = '#e5e0d4';
const SOFT = '#faf7ef';

const ROMANS = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

const CLASSES  = ['All', '6th', '7th', '8th'];
const SECTIONS_ALL = ['All','Jinnah','Iqbal','Sir Syed','Liaqat','Tipu','Babar','Abdali'];
const SUBJECTS_ALL = ['All','English','Urdu','Mathematics','Science','Computer Science','Social Studies','Islamiyat',"Tarjuma Tul Qur'an",'Fine Arts'];
const STATUS_ALL   = ['All','submitted','draft'];

function AdminPapersInner() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    class_name: 'All', section: 'All', subject: 'All', status: 'submitted', q: '',
  });
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const showToast = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_papers').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      setPapers(data || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load papers.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPapers(); }, []);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (filters.class_name !== 'All' && p.class_name !== filters.class_name) return false;
      if (filters.section    !== 'All' && p.section    !== filters.section)    return false;
      if (filters.subject    !== 'All' && p.subject    !== filters.subject)    return false;
      if (filters.status     !== 'All' && p.status     !== filters.status)     return false;
      if (filters.q.trim()) {
        const needle = filters.q.toLowerCase();
        const hay = `${p.test_name} ${p.teacher_name||''} ${p.subject} ${p.class_name} ${p.section}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [papers, filters]);

  const stats = useMemo(() => ({
    total: papers.length,
    submitted: papers.filter(p => p.status === 'submitted').length,
    drafts: papers.filter(p => p.status === 'draft').length,
  }), [papers]);

  const unlockPaper = async (p) => {
    if (!confirm(
      `Unlock this paper?\n\n` +
      `${p.subject} — Class ${p.class_name} (${p.section})\n` +
      `Teacher: ${p.teacher_name || '—'}\n\n` +
      `The teacher will be able to edit and re-submit.`
    )) return;
    try {
      const { error } = await supabase.from('exam_papers')
        .update({
          status: 'draft',
          unlocked_at: new Date().toISOString(),
          unlock_count: (p.unlock_count || 0) + 1,
        })
        .eq('id', p.id);
      if (error) throw error;
      showToast('success', 'Paper unlocked. Teacher can now edit.');
      fetchPapers();
      if (selected?.id === p.id) setSelected(null);
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Could not unlock.');
    }
  };

  const deletePaper = async (p) => {
    if (!confirm(`PERMANENTLY DELETE this paper?\n\n${p.subject} — ${p.class_name} (${p.section})\n\nThis cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('exam_papers').delete().eq('id', p.id);
      if (error) throw error;
      showToast('success', 'Paper deleted.');
      fetchPapers();
      if (selected?.id === p.id) setSelected(null);
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Could not delete.');
    }
  };

  // ─── DOCX Download ─────────────────────────────────────────
  const downloadDocx = async (paper) => {
    setDownloading(true);
    try {
      // Dynamic import so docx only loads when needed
      const docxLib = await import('docx');
      const {
        Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
        BorderStyle, PageBreak,
      } = docxLib;

      const meta = paper.meta || {};
      const computeTotal = (sections) =>
        (sections || []).reduce((sum, s) => sum + (Number(s.marksPer) || 0) * s.questions.length, 0);

      // Build paragraphs for one version
      const buildVersion = (versionKey) => {
        const ver = paper.versions?.[versionKey] || { sections: [] };
        const total = computeTotal(ver.sections);
        const out = [];

        // Version stamp
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 100 },
          children: [
            new TextRun({
              text: `VERSION ${versionKey}`,
              bold: true, size: 22, color: '0E1F3D',
            }),
          ],
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'C9922A' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C9922A' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'C9922A' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'C9922A' },
          },
        }));

        // School name
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text: meta.schoolName || 'Center of Excellence Sialkot (Boys)',
              bold: true, size: 30, color: '0E1F3D',
            }),
          ],
        }));

        // Test name + date
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text: `${meta.testName || ''}  •  ${meta.dateRange || ''}`,
              italics: true, size: 22,
            }),
          ],
        }));

        // Meta row
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          },
          children: [
            new TextRun({ text: 'Class: ', bold: true, size: 20 }),
            new TextRun({ text: `${paper.class_name} (${paper.section})    `, size: 20 }),
            new TextRun({ text: 'Subject: ', bold: true, size: 20 }),
            new TextRun({ text: `${paper.subject}    `, size: 20 }),
            new TextRun({ text: 'Time: ', bold: true, size: 20 }),
            new TextRun({ text: `${meta.timeAllowed || ''}    `, size: 20 }),
            new TextRun({ text: 'Total Marks: ', bold: true, size: 20 }),
            new TextRun({ text: `${paper.total_marks}`, size: 20 }),
          ],
        }));

        // Sections
        ver.sections.forEach((sec, i) => {
          const sMarks = (Number(sec.marksPer) || 0) * sec.questions.length;
          // Section heading
          out.push(new Paragraph({
            spacing: { before: 200, after: 60 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9922A' },
            },
            children: [
              new TextRun({
                text: `Section ${ROMANS[i] || i + 1}: ${sec.title || ''}`,
                bold: true, size: 24, color: '0E1F3D',
              }),
              new TextRun({
                text: `   (${sec.questions.length} × ${sec.marksPer} = ${sMarks} marks)`,
                size: 18, color: '444444',
              }),
            ],
          }));

          // Instructions
          if (sec.instructions) {
            out.push(new Paragraph({
              spacing: { before: 0, after: 80 },
              children: [
                new TextRun({ text: sec.instructions, italics: true, size: 20, color: '444444' }),
              ],
            }));
          }

          // Questions
          sec.questions.forEach((q, qi) => {
            if (sec.type === 'mcq') {
              out.push(new Paragraph({
                spacing: { before: 40, after: 20 },
                children: [
                  new TextRun({ text: `${qi + 1}. `, bold: true, size: 22 }),
                  new TextRun({ text: q.text || '', size: 22 }),
                ],
              }));
              const opts = q.options || ['', '', '', ''];
              const half1 = opts.slice(0, 2);
              const half2 = opts.slice(2, 4);
              [half1, half2].forEach((row, ri) => {
                const rowOpts = row.filter(o => o !== undefined);
                if (rowOpts.length === 0) return;
                out.push(new Paragraph({
                  indent: { left: 360 },
                  spacing: { before: 0, after: 0 },
                  children: rowOpts.flatMap((opt, oi) => {
                    const idx = ri * 2 + oi;
                    return [
                      new TextRun({ text: `(${String.fromCharCode(97 + idx)}) `, bold: true, size: 20 }),
                      new TextRun({ text: `${opt || ''}    `, size: 20 }),
                    ];
                  }),
                }));
              });
            } else {
              out.push(new Paragraph({
                spacing: { before: 40, after: 20 },
                children: [
                  new TextRun({ text: `${qi + 1}. `, bold: true, size: 22 }),
                  new TextRun({ text: q.text || '', size: 22 }),
                ],
              }));
            }
          });
        });

        return out;
      };

      // Build full doc — both versions back-to-back, no page break between
      const versionA = buildVersion('A');
      const divider = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 200 },
        border: {
          top: { style: BorderStyle.DASHED, size: 6, color: '000000' },
        },
        children: [
          new TextRun({
            text: '— END OF VERSION A —',
            bold: true, size: 18, color: '666666',
          }),
        ],
      });
      const versionB = buildVersion('B');

      const doc = new Document({
        creator: 'COE Sialkot',
        title: `${paper.subject} - ${paper.class_name} ${paper.section} - ${paper.test_name}`,
        styles: {
          default: { document: { run: { font: 'Times New Roman', size: 22 } } },
        },
        sections: [{
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4
              margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch margins
            },
          },
          children: [
            ...versionA,
            divider,
            ...versionB,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = `${paper.test_name}_${paper.class_name}_${paper.section}_${paper.subject}`
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      a.href = url;
      a.download = `${safeName}.docx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      showToast('success', '✓ Word document downloaded.');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('Cannot find module') || err.message?.includes('docx')) {
        showToast('error', "Run: npm install docx — then refresh.");
      } else {
        showToast('error', err.message || 'DOCX generation failed.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // ─── Styles ─────────────────────────────────────────
  const s = {
    page: { minHeight: '100vh', background: SOFT, fontFamily: 'system-ui, -apple-system, sans-serif', color: INK },
    topbar: {
      background: NAVY, color: '#fff', padding: '18px 28px',
      borderBottom: `4px solid ${GOLD}`, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    },
    brand: { display: 'flex', alignItems: 'center', gap: 14 },
    crest: {
      width: 44, height: 44, borderRadius: '50%', background: GOLD, color: NAVY,
      display: 'grid', placeItems: 'center',
      fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 18,
      border: `2px solid ${CREAM}`,
    },
    h1: { margin: 0, fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700 },
    sub: { margin: 0, fontSize: 12, opacity: 0.85, letterSpacing: 0.5 },

    container: { maxWidth: 1280, margin: '0 auto', padding: '24px 24px 60px' },

    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 },
    statCard: { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: 18 },
    statLabel: { fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.7 },
    statNum: { fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: NAVY, marginTop: 4 },

    filterCard: {
      background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10,
      padding: 16, marginBottom: 16,
    },
    filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: 10, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.7 },
    input: {
      padding: '8px 12px', border: `1px solid ${LINE}`, borderRadius: 6,
      fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff',
    },

    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' },
    th: { background: NAVY, color: '#fff', padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' },
    td: { padding: '12px 14px', borderTop: `1px solid ${LINE}`, fontSize: 14 },
    statusPill: { padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },

    btn: { padding: '6px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    btnView:   { background: NAVY, color: '#fff' },
    btnUnlock: { background: GOLD, color: NAVY },
    btnDelete: { background: 'transparent', color: '#b00020', border: '1px solid #f5c6cb' },
    btnDocx:   { background: '#2b579a', color: '#fff' },
    btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },

    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(14,31,61,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, zIndex: 50, overflow: 'auto',
    },
    modal: {
      background: SOFT, borderRadius: 12, maxWidth: 1100, width: '100%',
      maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.4)',
    },
    modalHead: {
      background: NAVY, color: '#fff', padding: '16px 24px',
      borderBottom: `4px solid ${GOLD}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 10, position: 'sticky', top: 0, zIndex: 5,
    },
    modalTitle: { margin: 0, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 },
    modalSub: { margin: 0, fontSize: 12, opacity: 0.85 },
    modalActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    btnGhost: { background: 'transparent', color: '#fff', border: `1px solid ${CREAM}`, padding: '7px 14px' },
    btnPrimary: { background: GOLD, color: NAVY, padding: '7px 14px' },

    // Compact paper preview
    paperSheet: {
      background: '#fff', maxWidth: 800, margin: '24px auto',
      padding: '28px 36px', boxShadow: '0 0 0 1px rgba(0,0,0,.06), 0 30px 60px rgba(14,31,61,.12)',
      color: '#000', fontFamily: '"Times New Roman", Times, serif', fontSize: 12, lineHeight: 1.4,
    },
    versionBlock: { paddingBottom: 14, marginBottom: 14 },
    paperHead: { textAlign: 'center', borderBottom: `2px solid ${INK}`, paddingBottom: 8, marginBottom: 10 },
    paperSchool: { fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 },
    paperTest: { fontSize: 11, fontWeight: 600, marginTop: 2, fontStyle: 'italic' },
    metaRow: {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
      fontSize: 11, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${INK}`,
    },
    metaCell: { display: 'flex', gap: 4 },
    metaLabel: { fontWeight: 700 },
    versionStamp: {
      display: 'inline-block', border: `2px solid ${GOLD}`, color: NAVY,
      padding: '2px 10px', fontFamily: 'Georgia, serif',
      fontWeight: 700, fontSize: 11, background: '#fff', letterSpacing: 1, marginBottom: 6,
    },
    pSection: { marginTop: 8 },
    pSectionTitle: {
      fontFamily: 'Georgia, serif', fontSize: 12.5, fontWeight: 700,
      color: NAVY, margin: 0, display: 'flex', justifyContent: 'space-between',
      alignItems: 'baseline', borderBottom: `1px solid ${GOLD}`, paddingBottom: 2,
    },
    pSectionMarks: { fontSize: 10, color: '#444', fontWeight: 600 },
    pInstr: { fontStyle: 'italic', fontSize: 10.5, marginTop: 2, marginBottom: 4, color: '#444' },
    pQuestion: { display: 'flex', gap: 6, marginBottom: 3 },
    pQNum: { fontWeight: 700, minWidth: 20, fontSize: 11.5 },
    pQText: { flex: 1, fontSize: 11.5 },
    versionDivider: {
      borderTop: `2px dashed ${INK}`,
      margin: '16px 0', textAlign: 'center', position: 'relative',
    },
    versionDividerLabel: {
      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
      background: '#fff', padding: '0 12px',
      fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#666',
    },

    toast: {
      position: 'fixed', top: 90, right: 20, zIndex: 100,
      padding: '12px 20px', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 20px rgba(0,0,0,.18)', maxWidth: 380,
    },
  };

  const computeTotal = (sections) =>
    (sections || []).reduce((sum, s) => sum + (Number(s.marksPer) || 0) * s.questions.length, 0);

  const renderVersionBlock = (paper, versionKey, isLast) => {
    const meta = paper.meta || {};
    const ver  = paper.versions?.[versionKey] || { sections: [] };
    return (
      <div key={versionKey} style={s.versionBlock}>
        <div style={s.paperHead}>
          <div style={s.versionStamp}>VERSION {versionKey}</div>
          <h1 style={s.paperSchool}>{meta.schoolName || 'Center of Excellence Sialkot (Boys)'}</h1>
          <div style={s.paperTest}>{meta.testName} &nbsp;•&nbsp; {meta.dateRange}</div>
          <div style={s.metaRow}>
            <div style={s.metaCell}><span style={s.metaLabel}>Class:</span> {paper.class_name} ({paper.section})</div>
            <div style={s.metaCell}><span style={s.metaLabel}>Subject:</span> {paper.subject}</div>
            <div style={s.metaCell}><span style={s.metaLabel}>Time:</span> {meta.timeAllowed}</div>
            <div style={s.metaCell}><span style={s.metaLabel}>Total Marks:</span> {paper.total_marks}</div>
          </div>
        </div>

        {ver.sections.map((sec, i) => {
          const sMarks = (Number(sec.marksPer) || 0) * sec.questions.length;
          return (
            <div key={sec.id || i} style={s.pSection}>
              <h2 style={s.pSectionTitle}>
                <span>Section {ROMANS[i] || i + 1}: {sec.title}</span>
                <span style={s.pSectionMarks}>({sec.questions.length} × {sec.marksPer} = {sMarks})</span>
              </h2>
              {sec.instructions && <div style={s.pInstr}>{sec.instructions}</div>}

              {sec.questions.map((q, qi) => {
                if (sec.type === 'mcq') {
                  return (
                    <div key={q.id || qi} style={{ marginBottom: 4 }}>
                      <div style={s.pQuestion}>
                        <span style={s.pQNum}>{qi + 1}.</span>
                        <span style={s.pQText}>{q.text}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 12px', paddingLeft: 26, fontSize: 10.5 }}>
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi}>
                            <span style={{ fontWeight: 600 }}>({String.fromCharCode(97 + oi)})</span> {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={q.id || qi} style={s.pQuestion}>
                    <span style={s.pQNum}>{qi + 1}.</span>
                    <span style={s.pQText}>{q.text}</span>
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

  const printSelected = () => {
    setTimeout(() => window.print(), 50);
  };

  const toastBg = toast?.kind === 'success' ? '#1a7a3e' : toast?.kind === 'error' ? '#b00020' : NAVY;

  return (
    <div style={s.page}>
      <style>{`
        input:focus, select:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(201,146,42,.15); }
        button:hover:not(:disabled) { filter: brightness(1.05); }
        tr:hover { background: ${SOFT}; }
        .paper-section { page-break-inside: avoid; }

        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .modal-print-area { background: #fff !important; }
          .paper-sheet {
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 12mm 14mm !important;
            max-width: 100% !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {toast && <div className="no-print" style={{ ...s.toast, background: toastBg }}>{toast.msg}</div>}

      <div className="no-print" style={s.topbar}>
        <div style={s.brand}>
          <div style={s.crest}>COE</div>
          <div>
            <h1 style={s.h1}>Paper Submissions — Admin</h1>
            <p style={s.sub}>Review, unlock, download as Word, and print teacher-submitted papers</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...s.btn, ...s.btnGhost }} onClick={fetchPapers}>↻ Refresh</button>
          <a href="/admin" style={{ ...s.btn, ...s.btnGhost, textDecoration: 'none' }}>← Admin Home</a>
        </div>
      </div>

      <div className="no-print" style={s.container}>
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statLabel}>Total Papers</div>
            <div style={s.statNum}>{stats.total}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Submitted (Locked)</div>
            <div style={{ ...s.statNum, color: '#1a7a3e' }}>{stats.submitted}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Drafts</div>
            <div style={{ ...s.statNum, color: '#a06700' }}>{stats.drafts}</div>
          </div>
        </div>

        <div style={s.filterCard}>
          <div style={s.filterGrid}>
            <div style={s.field}>
              <label style={s.label}>Search</label>
              <input style={s.input} placeholder="Teacher / subject / class…"
                value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Class</label>
              <select style={s.input} value={filters.class_name}
                onChange={(e) => setFilters({ ...filters, class_name: e.target.value })}>
                {CLASSES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Section</label>
              <select style={s.input} value={filters.section}
                onChange={(e) => setFilters({ ...filters, section: e.target.value })}>
                {SECTIONS_ALL.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Subject</label>
              <select style={s.input} value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}>
                {SUBJECTS_ALL.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Status</label>
              <select style={s.input} value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                {STATUS_ALL.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ ...s.statCard, textAlign: 'center', padding: 40 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...s.statCard, textAlign: 'center', padding: 40, color: '#888' }}>
            No papers match these filters.
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Test</th>
                <th style={s.th}>Class · Section</th>
                <th style={s.th}>Subject</th>
                <th style={s.th}>Teacher</th>
                <th style={s.th}>Marks</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Submitted</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={s.td}>{p.test_name}</td>
                  <td style={s.td}>{p.class_name} · {p.section}</td>
                  <td style={s.td}>{p.subject}</td>
                  <td style={s.td}>{p.teacher_name || <span style={{ color: '#aaa' }}>—</span>}</td>
                  <td style={s.td}>{p.total_marks}</td>
                  <td style={s.td}>
                    {p.status === 'submitted' ? (
                      <span style={{ ...s.statusPill, background: '#d4edda', color: '#155724' }}>🔒 Locked</span>
                    ) : (
                      <span style={{ ...s.statusPill, background: '#fff3cd', color: '#856404' }}>✎ Draft</span>
                    )}
                    {p.unlock_count > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: '#888' }}>
                        ({p.unlock_count}× unlocked)
                      </span>
                    )}
                  </td>
                  <td style={{ ...s.td, fontSize: 12, color: '#666' }}>
                    {p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '—'}
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button style={{ ...s.btn, ...s.btnView }}
                        onClick={() => setSelected(p)}>View</button>
                      <button
                        style={{ ...s.btn, ...s.btnDocx, ...(downloading ? s.btnDisabled : {}) }}
                        disabled={downloading}
                        onClick={() => downloadDocx(p)}
                      >📄 Word</button>
                      {p.status === 'submitted' && (
                        <button style={{ ...s.btn, ...s.btnUnlock }} onClick={() => unlockPaper(p)}>
                          🔓 Unlock
                        </button>
                      )}
                      <button style={{ ...s.btn, ...s.btnDelete }} onClick={() => deletePaper(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paper viewer modal */}
      {selected && (
        <div className="no-print" style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={s.modal}>
            <div className="no-print" style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>
                  {selected.subject} — {selected.class_name} ({selected.section})
                </h2>
                <p style={s.modalSub}>
                  {selected.test_name} • Teacher: {selected.teacher_name || '—'} • {selected.total_marks} marks
                  {selected.status === 'submitted' && ' • 🔒 Locked'}
                </p>
              </div>
              <div style={s.modalActions}>
                <button style={{ ...s.btn, ...s.btnGhost }} onClick={printSelected}>
                  ⎙ Print
                </button>
                <button
                  style={{ ...s.btn, ...s.btnDocx, padding: '7px 14px', ...(downloading ? s.btnDisabled : {}) }}
                  disabled={downloading}
                  onClick={() => downloadDocx(selected)}
                >
                  {downloading ? '⏳ Generating…' : '📄 Download Word'}
                </button>
                {selected.status === 'submitted' && (
                  <button style={{ ...s.btn, background: GOLD, color: NAVY, padding: '7px 14px' }}
                    onClick={() => unlockPaper(selected)}>🔓 Unlock</button>
                )}
                <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => setSelected(null)}>✕ Close</button>
              </div>
            </div>

            {/* One-sheet preview: both versions stacked */}
            <div className="modal-print-area" style={{ padding: '8px 0 24px' }}>
              <div className="paper-sheet" style={s.paperSheet}>
                {renderVersionBlock(selected, 'A', false)}
                {renderVersionBlock(selected, 'B', true)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPapersPage() {
  return (
    <AdminAuth>
      <AdminPapersInner />
    </AdminAuth>
  );
}
