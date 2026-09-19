"use client";

import { useState, useEffect } from "react";
import { examLabel } from "@/lib/awardListExams";

const NAVY = "#150F3F";
const NAVY_LIGHT = "#1F1760";
const GOLD = "#FCB629";

export default function AdminAwardListsPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [examId, setExamId] = useState("");
  const [exam, setExam] = useState(null);
  const [expandedCode, setExpandedCode] = useState("");
  const [subjectRows, setSubjectRows] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("examId") || "";
    setExamId(id);
    refresh(id);
  }, []);

  // Without examId this falls back to the current exam, so opening
  // /admin/award-lists directly still works.
  function refresh(id = examId) {
    const q = id ? `?examId=${encodeURIComponent(id)}` : "";
    fetch(`/api/award-list/sections${q}`)
      .then((r) => r.json())
      .then((d) => {
        setSections(d.sections || []);
        setExam(d.exam || null);
      });
  }

  const examQ = examId ? `&examId=${encodeURIComponent(examId)}` : "";

  function toggle(code) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(sections.map((s) => s.sheet_code)));
  }
  function selectNone() {
    setSelected(new Set());
  }

  async function toggleExpand(code) {
    if (expandedCode === code) {
      setExpandedCode("");
      return;
    }
    setExpandedCode(code);
    setSubjectsLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/award-list/admin-subjects?code=${encodeURIComponent(code)}&adminPassword=${encodeURIComponent(
          adminPassword
        )}${examQ}`
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load subjects");
      setSubjectRows(d.subjects || []);
    } catch (e) {
      setError(e.message);
      setSubjectRows([]);
    } finally {
      setSubjectsLoading(false);
    }
  }

  async function toggleSubjectLock(code, subject, locked) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/award-list/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subject, locked, adminPassword, examId: examId || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setSubjectRows((prev) => prev.map((r) => (r.subject === subject ? { ...r, locked } : r)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAllSubjects(code, locked) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/award-list/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, locked, adminPassword, examId: examId || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setSubjectRows((prev) => prev.map((r) => ({ ...r, locked })));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function download(kind) {
    if (selected.size === 0) {
      setError("Select at least one section first.");
      return;
    }
    const codes = Array.from(selected).join(",");
    const url = `/api/award-list/export/${kind}?codes=${encodeURIComponent(
      codes
    )}&adminPassword=${encodeURIComponent(adminPassword)}${examQ}`;
    window.location.href = url;
  }

  return (
    <div className="min-h-screen text-white" style={{ background: `radial-gradient(circle at top, ${NAVY_LIGHT}, #0A0826 60%)` }}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Award Lists — Admin</h1>
            <p className="text-xs md:text-sm uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              Centre of Excellence Sialkot
            </p>
            {exam && (
              <p className="text-sm font-semibold mt-1 text-white/90">
                {examLabel(exam)}{exam.is_current ? " · current" : ""}
              </p>
            )}
          </div>
        </div>

        <a href="/admin/exams" className="inline-block text-sm mb-4 underline" style={{ color: GOLD }}>
          &larr; All exams
        </a>
        <br />

        <input
          type="password"
          placeholder="Admin password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          name="award-list-admin"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className="rounded-lg px-4 py-2.5 w-64 text-white placeholder-white/40 border outline-none transition mb-5"
          style={{ background: NAVY, borderColor: "#ffffff26" }}
          onFocus={(e) => (e.target.style.borderColor = GOLD)}
          onBlur={(e) => (e.target.style.borderColor = "#ffffff26")}
        />

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-sm bg-red-500/10 border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        <p className="text-xs text-white/50 mb-3">
          Click a section to see its subject-by-subject lock status. A subject locks itself once
          every student has a mark — unlock it here if a teacher needs to correct something.
        </p>

        <div className="flex gap-4 mb-3 text-sm">
          <button onClick={selectAll} className="underline hover:opacity-80" style={{ color: GOLD }}>
            Select all
          </button>
          <button onClick={selectNone} className="underline hover:opacity-80" style={{ color: GOLD }}>
            Select none
          </button>
        </div>

        <div
          className="rounded-xl border divide-y mb-5 max-h-[65vh] overflow-y-auto shadow-lg"
          style={{ borderColor: `${GOLD}33` }}
        >
          {sections.map((s, idx) => (
            <div key={s.sheet_code} style={{ borderColor: "#ffffff14" }}>
              <div
                className="flex items-center gap-3 p-3"
                style={{ background: idx % 2 === 0 ? "#ffffff05" : "transparent" }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.sheet_code)}
                  onChange={() => toggle(s.sheet_code)}
                  className="h-4 w-4 accent-[#FCB629]"
                />
                <button
                  onClick={() => toggleExpand(s.sheet_code)}
                  disabled={!adminPassword}
                  className="flex-1 text-left disabled:opacity-50"
                >
                  Class {s.class} — {s.section_label}{" "}
                  <span className="text-xs text-white/50">
                    ({s.class_incharge}) {s.submitted ? "· in progress" : "· not started"}
                  </span>
                </button>
                <span className="text-xs" style={{ color: GOLD }}>
                  {expandedCode === s.sheet_code ? "▲ hide subjects" : "▼ subjects"}
                </span>
              </div>

              {expandedCode === s.sheet_code && (
                <div className="p-3 pt-0" style={{ background: "#00000033" }}>
                  {subjectsLoading ? (
                    <div className="text-xs text-white/50 py-2">Loading subjects…</div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-2">
                        <button
                          disabled={busy}
                          onClick={() => toggleAllSubjects(s.sheet_code, true)}
                          className="text-xs px-2.5 py-1 rounded border disabled:opacity-40"
                          style={{ borderColor: `${GOLD}55`, color: GOLD }}
                        >
                          Lock all
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => toggleAllSubjects(s.sheet_code, false)}
                          className="text-xs px-2.5 py-1 rounded border disabled:opacity-40"
                          style={{ borderColor: `${GOLD}55`, color: GOLD }}
                        >
                          Unlock all
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {subjectRows.map((row) => (
                          <div
                            key={row.subject}
                            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 border"
                            style={{ borderColor: "#ffffff1a", background: "#ffffff05" }}
                          >
                            <span className="text-xs">
                              {row.subject}
                              {row.total_marks !== null && (
                                <span className="text-white/40"> ({row.total_marks} marks)</span>
                              )}
                              {row.teacher_name && (
                                <span className="block text-white/40 text-[10px]">By: {row.teacher_name}</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                                style={
                                  row.locked
                                    ? { background: "#f59e0b1a", color: "#fbbf24", borderColor: "#f59e0b4d" }
                                    : { background: "#10b9811a", color: "#34d399", borderColor: "#10b9814d" }
                                }
                              >
                                {row.locked ? "Locked" : "Open"}
                              </span>
                              <button
                                disabled={busy}
                                onClick={() => toggleSubjectLock(s.sheet_code, row.subject, !row.locked)}
                                className="text-[11px] rounded px-2 py-1 border transition disabled:opacity-40 hover:brightness-125"
                                style={{ borderColor: `${GOLD}55`, color: GOLD }}
                              >
                                {row.locked ? "Unlock" : "Lock"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => download("excel")}
            disabled={!adminPassword}
            className="font-bold px-5 py-3 rounded-lg shadow-lg transition disabled:opacity-40 hover:brightness-110"
            style={{ background: "#1DB954", color: NAVY }}
          >
            Download Excel ({selected.size})
          </button>
          <button
            onClick={() => download("pdf")}
            disabled={!adminPassword}
            className="font-bold px-5 py-3 rounded-lg shadow-lg transition disabled:opacity-40 hover:brightness-110"
            style={{ background: GOLD, color: NAVY }}
          >
            Download PDF ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
