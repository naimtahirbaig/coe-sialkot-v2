"use client";

import { useState, useEffect } from "react";
import { MONTHS, YEARS, monthName, examLabel, groupExams, SUGGESTED_EXAM_NAMES, makeSlug, cleanSlug }
  from "@/lib/awardListExams";

const NAVY = "#150F3F";
const NAVY_LIGHT = "#1F1760";
const GOLD = "#FCB629";

// Exams → Year & Month → Award Lists → Exam name
//
// The exam flagged "current" is the one the shared /award-list link writes
// to, so teachers never pick an exam themselves. Admin switches it here
// when a new exam starts.

export default function ExamsPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [exams, setExams] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [year, setYear] = useState(YEARS[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Slug follows the name/month/year until the admin edits it by hand.
  const autoSlug = makeSlug(name, month, year);
  const effectiveSlug = slugTouched ? slug : autoSlug;

  useEffect(() => { refresh(); }, []);

  function refresh() {
    fetch("/api/award-list/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .catch(() => setError("Could not load exams."));
  }

  async function post(payload, okMsg) {
    setBusy(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/award-list/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, adminPassword }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setNotice(okMsg);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const grouped = groupExams(exams);
  const years = Object.keys(grouped).sort((a, b) => b - a);

  const inputCls = "rounded-lg px-4 py-2.5 text-white border outline-none";
  const inputStyle = { background: NAVY, borderColor: "#ffffff26" };

  return (
    <div className="min-h-screen text-white"
         style={{ background: `radial-gradient(circle at top, ${NAVY_LIGHT}, #0A0826 60%)` }}>
      <div className="max-w-5xl mx-auto p-4 md:p-8">

        <div className="flex items-center gap-4 rounded-2xl p-5 md:p-6 mb-6 shadow-xl border"
             style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
                      borderColor: `${GOLD}33` }}>
          <img src="/coe-logo.png" alt="COE Sialkot logo"
               className="h-14 w-14 md:h-16 md:w-16 rounded-full ring-2 shrink-0"
               style={{ ["--tw-ring-color"]: GOLD }} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Exams</h1>
            <p className="text-xs md:text-sm uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              Centre of Excellence Sialkot
            </p>
          </div>
        </div>

        <input
          type="password"
          placeholder="Admin password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          name="exams-admin"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className={`${inputCls} w-64 mb-5 placeholder-white/40`}
          style={inputStyle}
        />

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-sm bg-red-500/10 border-red-500/40 text-red-300">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-sm bg-emerald-500/10 border-emerald-500/40 text-emerald-300">
            {notice}
          </div>
        )}

        {/* Create a new exam */}
        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: `${GOLD}33`, background: "#ffffff06" }}>
          <h2 className="font-bold mb-3" style={{ color: GOLD }}>Add an exam</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-white/60 mb-1">Year</label>
              <select className={inputCls} style={inputStyle} value={year}
                      onChange={(e) => setYear(Number(e.target.value))}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Month</label>
              <select className={inputCls} style={inputStyle} value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs text-white/60 mb-1">Exam name</label>
              <input
                list="exam-name-suggestions"
                className={`${inputCls} w-full placeholder-white/40`}
                style={inputStyle}
                placeholder="e.g. Monthly Test"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <datalist id="exam-name-suggestions">
                {SUGGESTED_EXAM_NAMES.map((n) => <option key={n} value={n} />)}
              </datalist>
            </div>
            <button
              disabled={busy || !adminPassword || !name.trim() || !effectiveSlug}
              onClick={() =>
                post({ action: "create", year, month, name, slug: effectiveSlug }, "Exam created.")
                  .then(() => { setName(""); setSlug(""); setSlugTouched(false); })
              }
              className="font-bold px-5 py-2.5 rounded-lg disabled:opacity-40"
              style={{ background: GOLD, color: NAVY }}
            >
              Add exam
            </button>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-white/60 mb-1">
              Link (edit if you want something shorter)
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-sm text-white/40">coesialkot.com/award-list/</span>
              <input
                className={`${inputCls} placeholder-white/40`}
                style={{ ...inputStyle, minWidth: 260 }}
                placeholder="online-mcqs-sep-2026"
                value={effectiveSlug}
                onChange={(e) => { setSlugTouched(true); setSlug(cleanSlug(e.target.value)); }}
              />
              {slugTouched && (
                <button
                  onClick={() => { setSlugTouched(false); setSlug(""); }}
                  className="text-xs underline" style={{ color: GOLD }}
                >
                  reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Year → Month → Exams */}
        {years.length === 0 && (
          <p className="text-white/50 text-sm">No exams yet. Add one above.</p>
        )}

        {years.map((y) => (
          <div key={y} className="mb-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: GOLD }}>{y}</h2>
            {Object.keys(grouped[y]).sort((a, b) => b - a).map((m) => (
              <div key={m} className="mb-3">
                <h3 className="text-sm uppercase tracking-widest text-white/50 mb-2">
                  {monthName(m)}
                </h3>
                <div className="space-y-2">
                  {grouped[y][m].map((ex) => (
                    <div key={ex.id}
                         className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 border"
                         style={{
                           borderColor: ex.is_current ? GOLD : "#ffffff1a",
                           background: ex.is_current ? `${GOLD}14` : "#ffffff05",
                         }}>
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-semibold">{ex.name}</div>
                        <div className="text-xs font-mono" style={{ color: GOLD }}>
                          /award-list/{ex.slug}
                        </div>
                        <div className="text-xs text-white/40">
                          {ex.subjects_started > 0
                            ? `${ex.subjects_started} subject entries saved`
                            : "no marks entered yet"}
                        </div>
                      </div>

                      {ex.is_current ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                              style={{ background: `${GOLD}22`, color: GOLD, borderColor: `${GOLD}66` }}>
                          Current — open to teachers
                        </span>
                      ) : (
                        <button
                          disabled={busy || !adminPassword}
                          onClick={() => post({ action: "set_current", examId: ex.id },
                                              `${examLabel(ex)} is now the current exam.`)}
                          className="text-sm rounded-lg px-3 py-1.5 border disabled:opacity-40"
                          style={{ borderColor: `${GOLD}55`, color: GOLD }}
                        >
                          Make current
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const url = `https://www.coesialkot.com/award-list/${ex.slug}`;
                          navigator.clipboard?.writeText(url);
                          setNotice(`Copied: ${url}`);
                        }}
                        className="text-sm rounded-lg px-3 py-1.5 border"
                        style={{ borderColor: `${GOLD}55`, color: GOLD }}
                        title="Copy the teacher link for this exam"
                      >
                        Copy link
                      </button>

                      <a
                        href={`/result-cards`}
                        className="text-sm rounded-lg px-3 py-1.5 border"
                        style={{ borderColor: "#ffffff33", color: "#fff" }}
                        title="Printable student result cards"
                      >
                        Result Cards →
                      </a>

                      <a
                        href={`/proformas`}
                        className="text-sm rounded-lg px-3 py-1.5 border"
                        style={{ borderColor: "#ffffff33", color: "#fff" }}
                        title="Live class-wise and teacher-wise proformas"
                      >
                        Proformas →
                      </a>

                      <a
                        href={`/admin/award-lists?examId=${ex.id}`}
                        className="text-sm rounded-lg px-3 py-1.5 border"
                        style={{ borderColor: "#ffffff33", color: "#fff" }}
                      >
                        Award Lists →
                      </a>

                      {ex.subjects_started === 0 && !ex.is_current && (
                        <button
                          disabled={busy || !adminPassword}
                          onClick={() => {
                            if (confirm(`Delete "${examLabel(ex)}"? It has no saved marks.`)) {
                              post({ action: "delete", examId: ex.id }, "Exam deleted.");
                            }
                          }}
                          className="text-sm rounded-lg px-3 py-1.5 border disabled:opacity-40"
                          style={{ borderColor: "#ef444466", color: "#fca5a5" }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <p className="text-xs text-white/40 mt-8">
          Each exam has its own teacher link — use “Copy link” and share that when the exam
          starts. The old <span className="text-white/70">coesialkot.com/award-list</span> link
          still works and always opens the September 2026 Online MCQs exam, so links already
          shared keep working. Past exams keep their own marks and stay downloadable.
        </p>
      </div>
    </div>
  );
}
