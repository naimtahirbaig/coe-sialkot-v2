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
      (d.students || []).forEach((st) => (m[st.id] = {}));
      (d.marks || []).forEach((mk) => {
        m[mk.student_id] = m[mk.student_id] || {};
        m[mk.student_id][mk.subject_name] = mk.marks_obtained ?? "";
      });
      setMarks(m);
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

  // How many students still have no mark for a given subject
  function remainingFor(subject) {
    return students.filter((st) => {
      const v = (marks[st.id] || {})[subject];
      return v === "" || v === null || v === undefined;
    }).length;
  }

  async function handleSaveSubject(subject) {
    const teacherName = (subjectConfig[subject]?.teacher_name || "").trim();
    if (!teacherName) {
      setSubjectError((p) => ({ ...p, [subject]: "Enter the subject teacher's name before saving." }));
      return;
    }
    setSubjectSaving((p) => ({ ...p, [subject]: true }));
    setSubjectError((p) => ({ ...p, [subject]: "" }));
    setSubjectSaved((p) => ({ ...p, [subject]: false }));
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

      setSubjectConfig((prev) => ({ ...prev, [subject]: { ...prev[subject], locked: d.locked } }));
      setSubjectSaved((p) => ({ ...p, [subject]: true }));
      if (!d.locked) {
        const left = remainingFor(subject);
        setSubjectError((p) => ({
          ...p,
          [subject]: `Saved. Still open — ${left} student${left === 1 ? "" : "s"} without a mark.`,
        }));
      }
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
                handleSaveSubject={handleSaveSubject}
                subjectSaving={subjectSaving}
                subjectError={subjectError}
                subjectSaved={subjectSaved}
                remainingFor={remainingFor}
                inputBase={inputBase}
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
                            disabled={subjectConfig[s]?.locked}
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
                            disabled={subjectConfig[s]?.locked}
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
                              onClick={() => handleSaveSubject(s)}
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
                              <div className="text-[9px] text-emerald-300 mt-1">✓ Locked</div>
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
                                disabled={subjectConfig[s]?.locked}
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
}) {
  const NAVY = "#150F3F";
  const GOLD = "#FCB629";
  const cfg = subjectConfig[focusSubject] || {};
  const locked = !!cfg.locked;
  const saving = subjectSaving[focusSubject];
  const left = remainingFor(focusSubject);

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
            disabled={locked}
            onChange={(e) => updateTotalMarks(focusSubject, e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] mb-1 text-white/60">Your name</label>
          <TeacherSelect
            value={cfg.teacher_name ?? ""}
            disabled={locked}
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
          ✓ Saved and locked.
        </div>
      )}

      {!locked && (
        <div className="text-[11px] text-white/50 mb-2">
          {left === 0
            ? "All students have a mark — saving will lock this subject."
            : `${left} student${left === 1 ? "" : "s"} still without a mark. It stays unlocked until all are filled.`}
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
              <span className="block truncate">{st.student_name}</span>
              <span className="block text-[10px] text-white/40 truncate">{st.father_name}</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              className="w-20 rounded-lg px-2 py-2.5 text-center text-base text-white border outline-none shrink-0 disabled:opacity-50"
              style={inputBase}
              value={(marks[st.id] || {})[focusSubject] ?? ""}
              disabled={locked}
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
