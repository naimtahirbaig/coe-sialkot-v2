"use client";

import { useState, useEffect, useMemo } from "react";
import { computeTotals, assignPositions } from "@/lib/awardListConfig";
import { TEACHER_NAMES, OTHER_OPTION } from "@/lib/awardListTeachers";
import { examLabel } from "@/lib/awardListExams";

// Brand palette sampled from the COE / Punjab Daanish Schools logo.
const NAVY = "#150F3F";
const NAVY_LIGHT = "#1F1760";
const GOLD = "#FCB629";

// Two ways to enter marks:
//  - "focus"  : pick ONE subject, see a simple list of student names with a
//               single input each. This is the default on phones, because a
//               9-subject wide table forces horizontal scrolling that pushes
//               student names off screen.
//  - "table"  : the full grid (all subjects at once). Better on desktop.
//               S#/Name columns are sticky so they stay visible while
//               scrolling sideways.

export default function AwardListExamPage({ params }) {
  const examSlug = params.slug;

  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [sections, setSections] = useState([]);
  const [exam, setExam] = useState(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [section, setSection] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjectConfig, setSubjectConfig] = useState({});
  const [marks, setMarks] = useState({});
  // lockedMarks[studentId][subject] = true once that mark has been saved
  const [lockedMarks, setLockedMarks] = useState({});
  // Pending "Are you sure?" confirmation, or null
  const [confirmSave, setConfirmSave] = useState(null);

  const [subjectSaving, setSubjectSaving] = useState({});
  const [subjectError, setSubjectError] = useState({});
  const [subjectSaved, setSubjectSaved] = useState({});

  const [viewMode, setViewMode] = useState("focus");
  const [focusSubject, setFocusSubject] = useState("");

  // Default to the wide table on larger screens, focus mode on phones.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setViewMode("table");
    }
  }, []);

  useEffect(() => {
    fetch(`/api/award-list/sections?examSlug=${encodeURIComponent(examSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        setSections(d.sections || []);
        setExam(d.exam || null);
      })
      .catch(() => setError("Could not load section list."));
  }, []);

  async function loadSection(code) {
    setLoading(true);
    setError("");
    setSubjectSaved({});
    setSubjectError({});
    try {
      const res = await fetch(
        `/api/award-list/section?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}&examSlug=${encodeURIComponent(examSlug)}`
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load section");

      setSection(d.section);
      setSubjects(d.subjects);
      setStudents(d.students);
      setFocusSubject((prev) => (d.subjects.includes(prev) ? prev : d.subjects[0] || ""));

      const cfg = {};
      d.subjects.forEach((s) => (cfg[s] = { total_marks: "", teacher_name: "", locked: false }));
      (d.subjectConfig || []).forEach((c) => {
        cfg[c.subject_name] = {
          total_marks: c.total_marks ?? "",
          teacher_name: c.teacher_name ?? "",
          locked: !!c.locked,
        };
      });
      setSubjectConfig(cfg);

      const m = {};
      const lk = {};
      (d.students || []).forEach((st) => { m[st.id] = {}; lk[st.id] = {}; });
      (d.marks || []).forEach((mk) => {
        m[mk.student_id] = m[mk.student_id] || {};
        lk[mk.student_id] = lk[mk.student_id] || {};
        m[mk.student_id][mk.subject_name] = mk.marks_obtained ?? "";
        if (mk.locked && mk.marks_obtained !== null && mk.marks_obtained !== undefined) {
          lk[mk.student_id][mk.subject_name] = true;
        }
      });
      setMarks(m);
      setLockedMarks(lk);
      setUnlocked(true);
    } catch (e) {
      setError(e.message);
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  }

  function handleSectionPick(code) {
    setSelectedCode(code);
    if (code) loadSection(code);
  }

  function updateMark(studentId, subject, value) {
    setMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [subject]: value } }));
  }
  function updateTotalMarks(subject, value) {
    setSubjectConfig((p) => ({ ...p, [subject]: { ...p[subject], total_marks: value } }));
  }
  function updateTeacherName(subject, value) {
    setSubjectConfig((p) => ({ ...p, [subject]: { ...p[subject], teacher_name: value } }));
  }

  const computed = useMemo(() => {
    const totalsBySubject = {};
    subjects.forEach((s) => (totalsBySubject[s] = subjectConfig[s]?.total_marks ?? ""));
    const rows = students.map((st) => ({ ...st, ...computeTotals(marks[st.id] || {}, totalsBySubject) }));
    const positions = assignPositions(rows.map((r) => ({ id: r.id, obtained: r.obtained })));
    return rows.map((r) => ({ ...r, position: r.obtained !== null ? positions[r.id] : "-" }));
  }, [students, marks, subjectConfig, subjects]);

  function isMarkLocked(studentId, subject) {
    return !!(lockedMarks[studentId] || {})[subject] || !!subjectConfig[subject]?.locked;
  }
  // Once any mark in a subject is saved, its total and teacher are fixed.
  function subjectStarted(subject) {
    return students.some((st) => (lockedMarks[st.id] || {})[subject]);
  }

  // How many students still have no mark for a given subject
  function remainingFor(subject) {
    return students.filter((st) => {
      const v = (marks[st.id] || {})[subject];
      return v === "" || v === null || v === undefined;
    }).length;
  }

  // Step 1 of saving: check everything, then ask the teacher to confirm.
  // Validation happens BEFORE the question, so a teacher is never asked
  // "are you sure?" only for the save to be rejected afterwards.
  function requestSave(subject) {
    const cfg = subjectConfig[subject] || {};
    const started = subjectStarted(subject);
    const teacher = String(cfg.teacher_name || "").trim();
    const total = Number(cfg.total_marks);
    const fail = (msg) => setSubjectError((p) => ({ ...p, [subject]: msg }));

    setSubjectError((p) => ({ ...p, [subject]: "" }));
    setSubjectSaved((p) => ({ ...p, [subject]: "" }));

    if (!started) {
      if (cfg.total_marks === "" || !Number.isFinite(total) || total <= 0) {
        return fail("Enter the total marks for this paper before saving.");
      }
      if (!teacher) return fail("Select the subject teacher's name before saving.");
    }

    let toLock = 0, open = 0, bad = 0;
    students.forEach((st) => {
      if (isMarkLocked(st.id, subject)) return;
      const v = (marks[st.id] || {})[subject];
      if (v === "" || v === null || v === undefined) { open++; return; }
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || (Number.isFinite(total) && n > total)) bad++;
      else toLock++;
    });

    if (bad) {
      return fail(`${bad} mark${bad === 1 ? " is" : "s are"} not valid — each must be from 0 to ${total}. Correct ${bad === 1 ? "it" : "them"} before saving.`);
    }
    if (!toLock) {
      return fail("No new marks entered. Fill at least one empty box before saving.");
    }

    setConfirmSave({ subject, toLock, open, teacher, total, first: !started });
  }

  // Step 2: the teacher confirmed — save and lock.
  async function handleSaveSubject(subject) {
    const teacherName = (subjectConfig[subject]?.teacher_name || "").trim();
    if (!subjectStarted(subject) && !teacherName) {
      setSubjectError((p) => ({ ...p, [subject]: "Select the subject teacher's name before saving." }));
      return;
    }
    setSubjectSaving((p) => ({ ...p, [subject]: true }));
    setSubjectError((p) => ({ ...p, [subject]: "" }));
    setSubjectSaved((p) => ({ ...p, [subject]: "" }));
    try {
      const payload = {
        code: selectedCode,
        pin,
        examSlug,
        subject,
        totalMarks: subjectConfig[subject]?.total_marks ?? "",
        teacherName,
        marks: students.map((st) => ({ studentId: st.id, value: (marks[st.id] || {})[subject] ?? "" })),
      };
      const res = await fetch("/api/award-list/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");

      // Lock the boxes that were just saved; empty ones stay open.
      setLockedMarks((prev) => {
        const next = { ...prev };
        (d.savedStudentIds || []).forEach((id) => {
          next[id] = { ...(next[id] || {}), [subject]: true };
        });
        return next;
      });
      setSubjectConfig((prev) => ({
        ...prev,
        [subject]: { ...prev[subject], locked: d.complete,
                     teacher_name: d.teacher ?? prev[subject]?.teacher_name,
                     total_marks: d.total ?? prev[subject]?.total_marks },
      }));

      const who = d.teacher || teacherName;
      const lines = [
        d.savedNow > 0
          ? `✓ ${d.savedNow} mark${d.savedNow === 1 ? "" : "s"} saved and locked by ${who}.`
          : `No new marks to save — ${who}'s saved marks are already locked.`,
        d.complete
          ? `All ${d.students} students done — ${subject} is complete.`
          : `${d.lockedTotal}/${d.students} locked · ${d.remaining} box${d.remaining === 1 ? "" : "es"} still open.`,
        "Proformas and result cards are updated.",
      ];
      setSubjectSaved((p) => ({ ...p, [subject]: lines.join(" ") }));
    } catch (e) {
      setSubjectError((p) => ({ ...p, [subject]: e.message }));
    } finally {
      setSubjectSaving((p) => ({ ...p, [subject]: false }));
    }
  }

  const inputBase = {
    background: "#ffffff0d",
    borderColor: "#ffffff26",
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: `radial-gradient(circle at top, ${NAVY_LIGHT}, #0A0826 60%)` }}
    >
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8">
        {/* Header */}
        <div
          className="flex items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl border"
          style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`, borderColor: `${GOLD}33` }}
        >
          <img
            src="/coe-logo.png"
            alt="COE Sialkot logo"
            className="h-11 w-11 sm:h-16 sm:w-16 rounded-full ring-2 shrink-0"
            style={{ ["--tw-ring-color"]: GOLD }}
          />
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold tracking-tight truncate">
              Award List — Marks Entry
            </h1>
            <p className="text-[10px] sm:text-sm uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              Centre of Excellence Sialkot
            </p>
            {exam && (
              <p className="text-xs sm:text-base font-semibold mt-1 text-white/90">
                {examLabel(exam)}
              </p>
            )}
          </div>
        </div>

        {/* PIN + section */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center mb-3">
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            name="award-list-pin"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            className="rounded-lg px-4 py-3 sm:py-2.5 w-full sm:w-44 text-base sm:text-sm text-white placeholder-white/40 border outline-none"
            style={{ background: NAVY, borderColor: "#ffffff26" }}
          />
          <select
            className="rounded-lg px-4 py-3 sm:py-2.5 w-full sm:w-auto text-base sm:text-sm text-white border outline-none disabled:opacity-40"
            style={{ background: NAVY, borderColor: "#ffffff26" }}
            value={selectedCode}
            onChange={(e) => handleSectionPick(e.target.value)}
            disabled={!pin}
          >
            <option value="">Select your class-section…</option>
            {sections.map((s) => (
              <option key={s.sheet_code} value={s.sheet_code}>
                Class {s.class} — {s.section_label}
                {s.submitted ? " (in progress)" : ""}
              </option>
            ))}
          </select>
          {loading && (
            <span className="text-sm flex items-center gap-2" style={{ color: GOLD }}>
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: GOLD }} />
              Loading…
            </span>
          )}
        </div>

        {error && (
          <div className="mb-3 px-4 py-3 rounded-lg border text-sm bg-red-500/10 border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        {unlocked && section && (
          <>
            <div
              className="mb-3 text-xs sm:text-sm rounded-lg px-3 py-2 border flex flex-wrap gap-x-4 gap-y-1"
              style={{ background: `${NAVY}99`, borderColor: "#ffffff1a", color: "#ffffffcc" }}
            >
              <span>
                Incharge: <span className="font-semibold text-white">{section.class_incharge}</span>
              </span>
              <span>
                Students: <span className="font-semibold text-white">{section.student_count}</span>
              </span>
            </div>

            {/* View switcher */}
            <div className="flex gap-2 mb-3">
              {[
                { id: "focus", label: "One subject" },
                { id: "table", label: "All subjects" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id)}
                  className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg border transition"
                  style={
                    viewMode === m.id
                      ? { background: GOLD, color: NAVY, borderColor: GOLD }
                      : { background: "transparent", color: GOLD, borderColor: `${GOLD}55` }
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* ---------------- FOCUS MODE ---------------- */}
            {viewMode === "focus" && (
              <FocusMode
                subjects={subjects}
                focusSubject={focusSubject}
                setFocusSubject={setFocusSubject}
                subjectConfig={subjectConfig}
                updateTotalMarks={updateTotalMarks}
                updateTeacherName={updateTeacherName}
                students={students}
                marks={marks}
                updateMark={updateMark}
                handleSaveSubject={requestSave}
                subjectSaving={subjectSaving}
                subjectError={subjectError}
                subjectSaved={subjectSaved}
                remainingFor={remainingFor}
                inputBase={inputBase}
                isMarkLocked={isMarkLocked}
                subjectStarted={subjectStarted}
              />
            )}

            {/* ---------------- TABLE MODE ---------------- */}
            {viewMode === "table" && (
              <div className="overflow-x-auto rounded-xl border shadow-lg" style={{ borderColor: `${GOLD}33` }}>
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: NAVY }}>
                      <th
                        className="p-2 border-b sticky left-0 z-20 text-left"
                        style={{ color: GOLD, borderColor: `${GOLD}33`, background: NAVY, minWidth: 150 }}
                      >
                        Student
                      </th>
                      {subjects.map((s) => (
                        <th
                          key={s}
                          title={s}
                          className="p-2 border-b text-xs font-medium whitespace-nowrap"
                          style={{ color: GOLD, borderColor: `${GOLD}33` }}
                        >
                          {subjectConfig[s]?.locked ? "🔒 " : ""}
                          {s.length > 16 ? s.slice(0, 14) + "…" : s}
                        </th>
                      ))}
                      <th className="p-2 border-b" style={{ color: GOLD, borderColor: `${GOLD}33` }}>Obt.</th>
                      <th className="p-2 border-b" style={{ color: GOLD, borderColor: `${GOLD}33` }}>%</th>
                      <th className="p-2 border-b" style={{ color: GOLD, borderColor: `${GOLD}33` }}>Pos.</th>
                      <th className="p-2 border-b" style={{ color: GOLD, borderColor: `${GOLD}33` }}>Grade</th>
                    </tr>

                    <tr style={{ background: `${GOLD}1f` }}>
                      <td
                        className="p-2 border-b font-semibold whitespace-nowrap sticky left-0 z-20 text-xs"
                        style={{ color: GOLD, borderColor: `${GOLD}33`, background: "#3A2E18" }}
                      >
                        TOTAL MARKS
                      </td>
                      {subjects.map((s) => (
                        <td key={s} className="p-1.5 border-b text-center" style={{ borderColor: `${GOLD}33` }}>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-16 rounded px-1 py-1 text-center text-white border outline-none font-semibold disabled:opacity-50"
                            style={{ background: NAVY, borderColor: `${GOLD}55` }}
                            value={subjectConfig[s]?.total_marks ?? ""}
                            disabled={subjectConfig[s]?.locked || subjectStarted(s)}
                            title={subjectStarted(s) ? "Fixed after the first save" : ""}
                            onChange={(e) => updateTotalMarks(s, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                    </tr>

                    <tr style={{ background: `${GOLD}0f` }}>
                      <td
                        className="p-2 border-b font-semibold whitespace-nowrap sticky left-0 z-20 text-xs"
                        style={{ color: GOLD, borderColor: `${GOLD}33`, background: "#2E2616" }}
                      >
                        TEACHER
                      </td>
                      {subjects.map((s) => (
                        <td key={s} className="p-1.5 border-b text-center" style={{ borderColor: `${GOLD}33` }}>
                          <TeacherSelect
                            compact
                            value={subjectConfig[s]?.teacher_name ?? ""}
                            disabled={subjectConfig[s]?.locked || subjectStarted(s)}
                            onChange={(v) => updateTeacherName(s, v)}
                          />
                        </td>
                      ))}
                      <td className="border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                    </tr>

                    <tr style={{ background: NAVY_LIGHT }}>
                      <td
                        className="p-2 border-b sticky left-0 z-20 text-[10px] text-white/40"
                        style={{ borderColor: `${GOLD}33`, background: NAVY_LIGHT }}
                      >
                        Save per subject →
                      </td>
                      {subjects.map((s) => {
                        const locked = subjectConfig[s]?.locked;
                        const saving = subjectSaving[s];
                        return (
                          <td key={s} className="p-1.5 border-b text-center" style={{ borderColor: `${GOLD}33` }}>
                            <button
                              onClick={() => requestSave(s)}
                              disabled={locked || saving}
                              className="w-full text-xs font-bold px-2 py-1.5 rounded disabled:cursor-not-allowed"
                              style={
                                locked
                                  ? { background: "#ffffff14", color: "#ffffff66" }
                                  : { background: GOLD, color: NAVY, opacity: saving ? 0.6 : 1 }
                              }
                            >
                              {locked ? "Locked" : saving ? "…" : "Save"}
                            </button>
                            {subjectError[s] && (
                              <div className="text-[9px] text-amber-300 mt-1 leading-tight">{subjectError[s]}</div>
                            )}
                            {subjectSaved[s] && !subjectError[s] && (
                              <div className="text-[9px] text-emerald-300 mt-1 leading-tight">{subjectSaved[s]}</div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.map((row, idx) => {
                      const rowBg = idx % 2 === 0 ? "#14103A" : "#100C30";
                      return (
                        <tr key={row.id}>
                          <td
                            className="p-1.5 border-b sticky left-0 z-10"
                            style={{ borderColor: "#ffffff14", background: rowBg, minWidth: 150 }}
                          >
                            <div className="font-medium text-xs leading-tight">{row.student_name}</div>
                            <div className="text-[10px] text-white/40">
                              #{row.s_no} · Roll {row.roll_no}
                            </div>
                          </td>
                          {subjects.map((s) => (
                            <td
                              key={s}
                              className="p-1.5 border-b text-center"
                              style={{ borderColor: "#ffffff14", background: rowBg }}
                            >
                              <input
                                type="number"
                                inputMode="numeric"
                                className="w-14 rounded px-1 py-1 text-center text-white border outline-none disabled:opacity-50"
                                style={inputBase}
                                value={(marks[row.id] || {})[s] ?? ""}
                                disabled={isMarkLocked(row.id, s)}
                                title={isMarkLocked(row.id, s) ? "Saved and locked" : ""}
                                onChange={(e) => updateMark(row.id, s, e.target.value)}
                              />
                            </td>
                          ))}
                          <td
                            className="p-1.5 border-b text-center font-semibold"
                            style={{ borderColor: "#ffffff14", color: GOLD, background: rowBg }}
                          >
                            {row.obtained ?? ""}
                          </td>
                          <td className="p-1.5 border-b text-center" style={{ borderColor: "#ffffff14", background: rowBg }}>
                            {row.percentage ?? ""}
                          </td>
                          <td className="p-1.5 border-b text-center" style={{ borderColor: "#ffffff14", background: rowBg }}>
                            {row.position}
                          </td>
                          <td
                            className="p-1.5 border-b text-center font-semibold"
                            style={{ borderColor: "#ffffff14", color: GOLD, background: rowBg }}
                          >
                            {row.grade}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {confirmSave && (
        <ConfirmSaveDialog
          info={confirmSave}
          saving={!!subjectSaving[confirmSave.subject]}
          onCancel={() => setConfirmSave(null)}
          onConfirm={async () => {
            const subj = confirmSave.subject;
            await handleSaveSubject(subj);
            setConfirmSave(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Are you sure?" before marks are locked.                             */
/* ------------------------------------------------------------------ */
function ConfirmSaveDialog({ info, saving, onCancel, onConfirm }) {
  const NAVY = "#150F3F";
  const GOLD = "#FCB629";
  const { subject, toLock, open, teacher, total, first } = info;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !saving) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(5,4,20,0.72)" }}
         onClick={() => { if (!saving) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title"
           className="w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 text-white"
           style={{ background: NAVY, borderColor: `${GOLD}66` }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="text-2xl leading-none">🔒</div>
          <h2 id="confirm-title" className="text-lg sm:text-xl font-bold leading-snug">
            Are you sure to save &amp; lock added marks?
          </h2>
        </div>

        <div className="rounded-lg border px-4 py-3 mb-4 text-sm space-y-1"
             style={{ borderColor: "#ffffff1f", background: "#ffffff08" }}>
          <div><span className="text-white/50">Subject:</span> <b>{subject}</b></div>
          <div><span className="text-white/50">Teacher:</span> <b>{teacher}</b></div>
          <div><span className="text-white/50">Total marks:</span> <b>{total}</b></div>
        </div>

        <ul className="text-sm space-y-2 mb-5">
          <li>
            <b style={{ color: GOLD }}>{toLock} mark{toLock === 1 ? "" : "s"}</b> will be saved and
            locked. Once locked, they cannot be changed — only an admin can unlock them.
          </li>
          {open > 0 && (
            <li className="text-white/70">
              {open} empty box{open === 1 ? "" : "es"} will stay open to fill later.
            </li>
          )}
          {first && (
            <li className="text-white/70">
              The total marks ({total}) and teacher name will also be fixed.
            </li>
          )}
        </ul>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button onClick={onCancel} disabled={saving}
                  className="px-4 py-3 sm:py-2.5 rounded-lg border font-semibold disabled:opacity-40"
                  style={{ borderColor: "#ffffff33" }}>
            No, go back
          </button>
          <button onClick={onConfirm} disabled={saving} autoFocus
                  className="px-5 py-3 sm:py-2.5 rounded-lg font-bold disabled:opacity-60"
                  style={{ background: GOLD, color: NAVY }}>
            {saving ? "Saving…" : "Yes, save & lock"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Teacher name picker.
   A dropdown of known staff, plus "Other…" for anyone not listed
   (substitutes, new staff). A name already saved but missing from the
   list is kept and shown as its own option, so editing a subject never
   silently wipes or changes who was recorded against it.               */
/* ------------------------------------------------------------------ */
function TeacherSelect({ value, onChange, disabled, compact = false }) {
  const NAVY = "#150F3F";
  const GOLD = "#FCB629";
  const known = TEACHER_NAMES.includes(value);
  const [manual, setManual] = useState(false);

  // A saved name that isn't in the list gets its own option so it survives.
  const extra = value && !known ? [value] : [];
  const showText = manual || (!!value && !known);

  function handleSelect(v) {
    if (v === OTHER_OPTION) {
      setManual(true);
      onChange("");
    } else {
      setManual(false);
      onChange(v);
    }
  }

  const selectStyle = {
    background: NAVY,
    borderColor: `${GOLD}55`,
  };

  return (
    <div className={compact ? "" : "space-y-2"}>
      <select
        className={
          compact
            ? "w-32 rounded px-1 py-1 text-white border outline-none text-xs disabled:opacity-50"
            : "rounded-lg px-3 py-3 w-full text-base text-white border outline-none disabled:opacity-50"
        }
        style={selectStyle}
        value={showText ? OTHER_OPTION : value || ""}
        disabled={disabled}
        onChange={(e) => handleSelect(e.target.value)}
      >
        <option value="">— Select your name —</option>
        {[...TEACHER_NAMES, ...extra].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value={OTHER_OPTION}>Other…</option>
      </select>

      {showText && (
        <input
          type="text"
          placeholder="Type your name"
          className={
            compact
              ? "w-32 mt-1 rounded px-1 py-1 text-center text-white border outline-none text-xs disabled:opacity-50"
              : "rounded-lg px-3 py-3 w-full text-base text-white border outline-none disabled:opacity-50"
          }
          style={selectStyle}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Focus mode: one subject at a time, names always visible, no sideways
   scrolling. This is what teachers will use on a phone.                */
/* ------------------------------------------------------------------ */
function FocusMode({
  subjects,
  focusSubject,
  setFocusSubject,
  subjectConfig,
  updateTotalMarks,
  updateTeacherName,
  students,
  marks,
  updateMark,
  handleSaveSubject,
  subjectSaving,
  subjectError,
  subjectSaved,
  remainingFor,
  inputBase,
  isMarkLocked,
  subjectStarted,
}) {
  const NAVY = "#150F3F";
  const GOLD = "#FCB629";
  const cfg = subjectConfig[focusSubject] || {};
  const locked = !!cfg.locked;
  const saving = subjectSaving[focusSubject];
  const left = remainingFor(focusSubject);
  const started = subjectStarted(focusSubject);

  return (
    <div>
      {/* Subject picker */}
      <label className="block text-xs mb-1" style={{ color: GOLD }}>
        Subject you teach
      </label>
      <select
        className="rounded-lg px-4 py-3 w-full text-base text-white border outline-none mb-3"
        style={{ background: NAVY, borderColor: `${GOLD}55` }}
        value={focusSubject}
        onChange={(e) => setFocusSubject(e.target.value)}
      >
        {subjects.map((s) => (
          <option key={s} value={s}>
            {subjectConfig[s]?.locked ? "🔒 " : ""}
            {s}
          </option>
        ))}
      </select>

      {/* Subject settings */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[11px] mb-1 text-white/60">Total marks</label>
          <input
            type="number"
            inputMode="numeric"
            className="rounded-lg px-3 py-3 w-full text-base text-white border outline-none disabled:opacity-50"
            style={{ background: NAVY, borderColor: `${GOLD}55` }}
            value={cfg.total_marks ?? ""}
            disabled={locked || started}
            onChange={(e) => updateTotalMarks(focusSubject, e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] mb-1 text-white/60">Your name</label>
          <TeacherSelect
            value={cfg.teacher_name ?? ""}
            disabled={locked || started}
            onChange={(v) => updateTeacherName(focusSubject, v)}
          />
        </div>
      </div>

      {locked && (
        <div className="mb-3 px-3 py-2 rounded-lg border text-xs bg-amber-500/10 border-amber-500/40 text-amber-300">
          🔒 This subject is locked. Ask an admin to unlock it to make changes.
        </div>
      )}
      {subjectError[focusSubject] && (
        <div className="mb-3 px-3 py-2 rounded-lg border text-xs bg-amber-500/10 border-amber-500/40 text-amber-300">
          {subjectError[focusSubject]}
        </div>
      )}
      {subjectSaved[focusSubject] && !subjectError[focusSubject] && (
        <div className="mb-3 px-3 py-2 rounded-lg border text-xs bg-emerald-500/10 border-emerald-500/40 text-emerald-300">
          {subjectSaved[focusSubject]}
        </div>
      )}

      {!locked && (
        <div className="text-[11px] text-white/50 mb-2">
          {started
            ? `Saved marks are locked. ${left} empty box${left === 1 ? "" : "es"} still open — fill and save to lock ${left === 1 ? "it" : "them"}.`
            : "Each mark locks as soon as you save it. Empty boxes stay open until you fill and save them. Total marks and your name are fixed by the first save."}
        </div>
      )}

      {/* Student list */}
      <div className="rounded-xl border overflow-hidden mb-4" style={{ borderColor: `${GOLD}33` }}>
        {students.map((st, idx) => (
          <div
            key={st.id}
            className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
            style={{ background: idx % 2 === 0 ? "#ffffff08" : "transparent", borderColor: "#ffffff14" }}
          >
            <span className="text-[11px] text-white/40 w-8 shrink-0 tabular-nums">{st.roll_no}</span>
            <span className="flex-1 text-sm leading-tight min-w-0">
              <span className="block truncate">
                {isMarkLocked(st.id, focusSubject) ? "🔒 " : ""}{st.student_name}
              </span>
              <span className="block text-[10px] text-white/40 truncate">{st.father_name}</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              className="w-20 rounded-lg px-2 py-2.5 text-center text-base text-white border outline-none shrink-0 disabled:opacity-50"
              style={inputBase}
              value={(marks[st.id] || {})[focusSubject] ?? ""}
              disabled={isMarkLocked(st.id, focusSubject)}
              title={isMarkLocked(st.id, focusSubject) ? "Saved and locked" : ""}
              onChange={(e) => updateMark(st.id, focusSubject, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Sticky save bar */}
      <div
        className="sticky bottom-0 -mx-3 sm:mx-0 px-3 py-3 border-t backdrop-blur"
        style={{ background: "#0A0826ee", borderColor: `${GOLD}33` }}
      >
        <button
          onClick={() => handleSaveSubject(focusSubject)}
          disabled={locked || saving}
          className="w-full font-bold px-5 py-3.5 rounded-lg text-base disabled:cursor-not-allowed"
          style={
            locked
              ? { background: "#ffffff14", color: "#ffffff66" }
              : { background: GOLD, color: NAVY, opacity: saving ? 0.6 : 1 }
          }
        >
          {locked ? "Locked" : saving ? "Saving…" : `Save ${focusSubject}`}
        </button>
      </div>
    </div>
  );
}
