"use client";

import { useState, useEffect, useMemo } from "react";
import { computeTotals, assignPositions } from "@/lib/awardListConfig";

// Brand palette sampled from the COE / Punjab Daanish Schools logo.
const NAVY = "#150F3F";
const NAVY_LIGHT = "#1F1760";
const GOLD = "#FCB629";

// Each subject has its OWN save button, because a different subject
// teacher fills in each column. A subject auto-locks the moment every
// student in the section has a mark for it; if any box is still empty
// it stays unlocked so the teacher can come back and finish later. An
// admin can unlock a locked subject at any time from /admin/award-lists.

export default function AwardListPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [section, setSection] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  // subjectConfig: { [subject]: { total_marks, locked } }
  const [subjectConfig, setSubjectConfig] = useState({});
  const [marks, setMarks] = useState({}); // { studentId: { subject: value } }

  // per-subject UI state
  const [subjectSaving, setSubjectSaving] = useState({});
  const [subjectError, setSubjectError] = useState({});
  const [subjectSaved, setSubjectSaved] = useState({});

  useEffect(() => {
    fetch("/api/award-list/sections")
      .then((r) => r.json())
      .then((d) => setSections(d.sections || []))
      .catch(() => setError("Could not load section list."));
  }, []);

  async function loadSection(code) {
    setLoading(true);
    setError("");
    setSubjectSaved({});
    setSubjectError({});
    try {
      const res = await fetch(
        `/api/award-list/section?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}`
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load section");

      setSection(d.section);
      setSubjects(d.subjects);
      setStudents(d.students);

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
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: value },
    }));
  }

  function updateTotalMarks(subject, value) {
    setSubjectConfig((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], total_marks: value },
    }));
  }

  function updateTeacherName(subject, value) {
    setSubjectConfig((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], teacher_name: value },
    }));
  }

  const computed = useMemo(() => {
    const totalsBySubject = {};
    subjects.forEach((s) => (totalsBySubject[s] = subjectConfig[s]?.total_marks ?? ""));
    const rows = students.map((st) => {
      const totals = computeTotals(marks[st.id] || {}, totalsBySubject);
      return { ...st, ...totals };
    });
    const positions = assignPositions(rows.map((r) => ({ id: r.id, obtained: r.obtained })));
    return rows.map((r) => ({ ...r, position: r.obtained !== null ? positions[r.id] : "-" }));
  }, [students, marks, subjectConfig, subjects]);

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
        subject,
        totalMarks: subjectConfig[subject]?.total_marks ?? "",
        teacherName,
        marks: students.map((st) => ({
          studentId: st.id,
          value: (marks[st.id] || {})[subject] ?? "",
        })),
      };
      const res = await fetch("/api/award-list/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");

      setSubjectConfig((prev) => ({
        ...prev,
        [subject]: { ...prev[subject], locked: d.locked },
      }));
      setSubjectSaved((p) => ({ ...p, [subject]: true }));
      if (!d.locked) {
        setSubjectError((p) => ({
          ...p,
          [subject]: "Saved, but stays unlocked — some students still have no mark entered.",
        }));
      }
    } catch (e) {
      setSubjectError((p) => ({ ...p, [subject]: e.message }));
    } finally {
      setSubjectSaving((p) => ({ ...p, [subject]: false }));
    }
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: `radial-gradient(circle at top, ${NAVY_LIGHT}, #0A0826 60%)` }}
    >
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div
          className="flex items-center gap-4 rounded-2xl p-5 md:p-6 mb-6 shadow-xl border"
          style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`, borderColor: `${GOLD}33` }}
        >
          <img
            src="/coe-logo.png"
            alt="COE Sialkot logo"
            className="h-14 w-14 md:h-16 md:w-16 rounded-full ring-2 shrink-0"
            style={{ ["--tw-ring-color"]: GOLD }}
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Award List — Marks Entry</h1>
            <p className="text-xs md:text-sm uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              Centre of Excellence Sialkot
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="rounded-lg px-4 py-2.5 w-44 text-white placeholder-white/40 border outline-none transition"
            style={{ background: NAVY, borderColor: "#ffffff26" }}
            onFocus={(e) => (e.target.style.borderColor = GOLD)}
            onBlur={(e) => (e.target.style.borderColor = "#ffffff26")}
          />
          <select
            className="rounded-lg px-4 py-2.5 text-white border outline-none transition disabled:opacity-40"
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
          <div className="mb-4 px-4 py-3 rounded-lg border text-sm bg-red-500/10 border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        <p className="text-xs text-white/50 mb-4">
          Each subject has its own Save button. A subject locks automatically once every
          student has a mark — if you leave any box empty it stays open so you can finish later.
        </p>

        {unlocked && section && (
          <>
            <div
              className="mb-3 text-sm rounded-lg px-4 py-2.5 border inline-flex gap-4 flex-wrap"
              style={{ background: `${NAVY}99`, borderColor: "#ffffff1a", color: "#ffffffcc" }}
            >
              <span>
                Class Incharge: <span className="font-semibold text-white">{section.class_incharge}</span>
              </span>
              <span>
                No. of Students: <span className="font-semibold text-white">{section.student_count}</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border shadow-lg" style={{ borderColor: `${GOLD}33` }}>
              <table className="min-w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  {/* Column headers */}
                  <tr style={{ background: NAVY }}>
                    <th className="p-2 border-b" style={{ color: GOLD, borderColor: `${GOLD}33` }}>S#</th>
                    <th className="p-2 border-b" style={{ color: GOLD, borderColor: `${GOLD}33` }}>Roll</th>
                    <th className="p-2 border-b text-left" style={{ color: GOLD, borderColor: `${GOLD}33` }}>
                      Student Name
                    </th>
                    <th className="p-2 border-b text-left" style={{ color: GOLD, borderColor: `${GOLD}33` }}>
                      Father's Name
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

                  {/* Total Marks row */}
                  <tr style={{ background: `${GOLD}1f` }}>
                    <td
                      className="p-2 border-b font-semibold whitespace-nowrap"
                      style={{ color: GOLD, borderColor: `${GOLD}33` }}
                      colSpan={4}
                    >
                      TOTAL MARKS (enter once)
                    </td>
                    {subjects.map((s) => {
                      const locked = subjectConfig[s]?.locked;
                      return (
                        <td key={s} className="p-1.5 border-b text-center" style={{ borderColor: `${GOLD}33` }}>
                          <input
                            type="number"
                            className="w-16 rounded px-1 py-1 text-center text-white border outline-none font-semibold disabled:opacity-50"
                            style={{ background: NAVY, borderColor: `${GOLD}55` }}
                            value={subjectConfig[s]?.total_marks ?? ""}
                            disabled={locked}
                            onChange={(e) => updateTotalMarks(s, e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                  </tr>

                  {/* Subject Teacher name row */}
                  <tr style={{ background: `${GOLD}0f` }}>
                    <td
                      className="p-2 border-b font-semibold whitespace-nowrap"
                      style={{ color: GOLD, borderColor: `${GOLD}33` }}
                      colSpan={4}
                    >
                      SUBJECT TEACHER
                    </td>
                    {subjects.map((s) => {
                      const locked = subjectConfig[s]?.locked;
                      return (
                        <td key={s} className="p-1.5 border-b text-center" style={{ borderColor: `${GOLD}33` }}>
                          <input
                            type="text"
                            placeholder="Your name"
                            className="w-24 rounded px-1 py-1 text-center text-white border outline-none text-xs disabled:opacity-50"
                            style={{ background: NAVY, borderColor: `${GOLD}55` }}
                            value={subjectConfig[s]?.teacher_name ?? ""}
                            disabled={locked}
                            onChange={(e) => updateTeacherName(s, e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                  </tr>

                  {/* Per-subject Save row */}
                  <tr style={{ background: NAVY_LIGHT }}>
                    <td className="p-2 border-b text-xs text-white/40" colSpan={4} style={{ borderColor: `${GOLD}33` }}>
                      Save each subject once you've finished entering it
                    </td>
                    {subjects.map((s) => {
                      const locked = subjectConfig[s]?.locked;
                      const saving = subjectSaving[s];
                      return (
                        <td key={s} className="p-1.5 border-b text-center" style={{ borderColor: `${GOLD}33` }}>
                          <button
                            onClick={() => handleSaveSubject(s)}
                            disabled={locked || saving}
                            className="w-full text-xs font-bold px-2 py-1.5 rounded transition disabled:cursor-not-allowed hover:brightness-110"
                            style={
                              locked
                                ? { background: "#ffffff14", color: "#ffffff66" }
                                : { background: GOLD, color: NAVY, opacity: saving ? 0.6 : 1 }
                            }
                          >
                            {locked ? "Locked" : saving ? "Saving…" : "Save"}
                          </button>
                        </td>
                      );
                    })}
                    <td className="border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                  </tr>

                  {/* Per-subject status messages */}
                  {subjects.some((s) => subjectError[s] || subjectSaved[s]) && (
                    <tr style={{ background: NAVY }}>
                      <td className="p-1 border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                      {subjects.map((s) => (
                        <td key={s} className="p-1 border-b text-center" style={{ borderColor: `${GOLD}33` }}>
                          {subjectError[s] ? (
                            <span className="text-[10px] text-amber-300 leading-tight block">{subjectError[s]}</span>
                          ) : subjectSaved[s] ? (
                            <span className="text-[10px] text-emerald-300">✓ Saved &amp; locked</span>
                          ) : null}
                        </td>
                      ))}
                      <td className="border-b" colSpan={4} style={{ borderColor: `${GOLD}33` }}></td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {computed.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{ background: idx % 2 === 0 ? "#ffffff05" : "transparent" }}
                      className="hover:brightness-125 transition"
                    >
                      <td className="p-1.5 border-b text-center text-white/70" style={{ borderColor: "#ffffff14" }}>
                        {row.s_no}
                      </td>
                      <td className="p-1.5 border-b text-center text-white/70" style={{ borderColor: "#ffffff14" }}>
                        {row.roll_no}
                      </td>
                      <td className="p-1.5 border-b font-medium" style={{ borderColor: "#ffffff14" }}>
                        {row.student_name}
                      </td>
                      <td className="p-1.5 border-b text-white/70" style={{ borderColor: "#ffffff14" }}>
                        {row.father_name}
                      </td>
                      {subjects.map((s) => {
                        const locked = subjectConfig[s]?.locked;
                        return (
                          <td key={s} className="p-1.5 border-b text-center" style={{ borderColor: "#ffffff14" }}>
                            <input
                              type="number"
                              className="w-14 rounded px-1 py-1 text-center text-white border outline-none disabled:opacity-50"
                              style={{ background: "#ffffff0d", borderColor: "#ffffff26" }}
                              value={(marks[row.id] || {})[s] ?? ""}
                              disabled={locked}
                              onChange={(e) => updateMark(row.id, s, e.target.value)}
                            />
                          </td>
                        );
                      })}
                      <td
                        className="p-1.5 border-b text-center font-semibold"
                        style={{ borderColor: "#ffffff14", color: GOLD }}
                      >
                        {row.obtained ?? ""}
                      </td>
                      <td className="p-1.5 border-b text-center" style={{ borderColor: "#ffffff14" }}>
                        {row.percentage ?? ""}
                      </td>
                      <td className="p-1.5 border-b text-center" style={{ borderColor: "#ffffff14" }}>
                        {row.position}
                      </td>
                      <td
                        className="p-1.5 border-b text-center font-semibold"
                        style={{ borderColor: "#ffffff14", color: GOLD }}
                      >
                        {row.grade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
