"use client";

import { useState, useEffect, useCallback } from "react";
import { examLabel } from "@/lib/awardListExams";
import { P1_HEADERS, P2_HEADERS, PASS_PCT } from "@/lib/proformas";

const NAVY = "#150F3F";
const NAVY_LIGHT = "#1F1760";
const GOLD = "#FCB629";

// Teacher-wise and class-wise detail proformas.
//
// Always computed live from the award lists — there is no separate copy to
// keep in step. Refreshing shows whatever teachers have saved by then.
// Opens with either the teachers' PIN or the admin password.

export default function ProformasPage() {
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState("pin");        // which field the secret is
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("p1");
  const [auto, setAuto] = useState(true);
  const [dlClass, setDlClass] = useState("");   // "" = all classes

  useEffect(() => {
    fetch("/api/award-list/exams")
      .then((r) => r.json())
      .then((d) => {
        setExams(d.exams || []);
        if (d.current) setExamId(d.current.id);
      })
      .catch(() => setError("Could not load the exam list."));
  }, []);

  const authQ = useCallback(
    () => (mode === "admin"
      ? `adminPassword=${encodeURIComponent(secret)}`
      : `pin=${encodeURIComponent(secret)}`),
    [mode, secret]
  );

  const load = useCallback(async (quiet = false) => {
    if (!secret || !examId) return;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/award-list/proformas?examId=${encodeURIComponent(examId)}&${authQ()}`
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not load");
      setData(d);
    } catch (e) {
      setError(e.message);
      if (!quiet) setData(null);
    } finally {
      setLoading(false);
    }
  }, [secret, examId, authQ]);

  // Live: re-pull every 30s so the page reflects marks saved meanwhile.
  useEffect(() => {
    if (!auto || !data) return;
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [auto, data, load]);

  function download() {
    const cls = dlClass ? `&class=${encodeURIComponent(dlClass)}` : "";
    window.location.href =
      `/api/award-list/proformas/export?examId=${encodeURIComponent(examId)}&${authQ()}${cls}`;
  }

  // Proforma 1 is laid out per class (the template says "of ____ Class"),
  // so the download is offered per class as well as all at once.
  const classesPresent = [...new Set((data?.proforma1 || []).map((r) => r.class))]
    .sort((a, b) => a - b);

  const cell = "px-2 py-1.5 border text-center whitespace-nowrap";
  const bc = { borderColor: "#ffffff1f" };

  // Pinned columns: Sr. No, name, class. They stay in view while the
  // figures scroll sideways, like the Student column on the award list.
  // Sticky cells need a SOLID background, or the scrolling figures would
  // show through underneath them.
  const STICKY = [
    { w: 52, left: 0 },
    { w: 170, left: 52 },
    { w: 140, left: 222 },
  ];
  const rowBg = (i) => (i % 2 ? "#140F40" : "#1B1650");
  const stick = (idx, background, head = false) => ({
    position: "sticky",
    left: STICKY[idx].left,
    minWidth: STICKY[idx].w,
    maxWidth: STICKY[idx].w,
    zIndex: head ? 30 : 10,
    background,
    ...(head ? { top: 0 } : {}),
    // gold edge marks where the pinned block ends
    ...(idx === 2 ? { boxShadow: `2px 0 0 ${GOLD}66` } : {}),
  });
  const stickyHead = { position: "sticky", top: 0, zIndex: 20, background: NAVY };
  const nameCell = "px-2 py-1.5 border text-left";   // allowed to wrap
  const num = (v) => (v === null || v === undefined || v === "" ? "" : v);

  return (
    <div className="min-h-screen text-white"
         style={{ background: `radial-gradient(circle at top, ${NAVY_LIGHT}, #0A0826 60%)` }}>
      <div className="max-w-[1800px] mx-auto p-3 sm:p-6">

        <div className="flex items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-6 mb-5 shadow-xl border"
             style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
                      borderColor: `${GOLD}33` }}>
          <img src="/coe-logo.png" alt="COE Sialkot logo"
               className="h-12 w-12 sm:h-16 sm:w-16 rounded-full ring-2 shrink-0"
               style={{ ["--tw-ring-color"]: GOLD }} />
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold tracking-tight">
              Teacher-wise &amp; Class-wise Detail Proformas
            </h1>
            <p className="text-[10px] sm:text-sm uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              Centre of Excellence Sialkot
            </p>
            {data?.exam && (
              <p className="text-xs sm:text-base font-semibold mt-1 text-white/90">
                {examLabel(data.exam)}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-end mb-4">
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Sign in with</label>
            <select className="rounded-lg px-3 py-2.5 text-white border outline-none"
                    style={{ background: NAVY, borderColor: "#ffffff26" }}
                    value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="pin">Teachers' PIN</option>
              <option value="admin">Admin password</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">
              {mode === "admin" ? "Admin password" : "PIN"}
            </label>
            <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
                   name="proforma-secret" autoComplete="off" data-1p-ignore data-lpignore="true"
                   className="rounded-lg px-3 py-2.5 w-44 text-white placeholder-white/40 border outline-none"
                   style={{ background: NAVY, borderColor: "#ffffff26" }} />
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Exam</label>
            <select className="rounded-lg px-3 py-2.5 text-white border outline-none"
                    style={{ background: NAVY, borderColor: "#ffffff26" }}
                    value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{examLabel(e)}{e.is_current ? " · current" : ""}</option>
              ))}
            </select>
          </div>
          <a href="/result-cards" className="text-sm underline self-center"
             style={{ color: GOLD }}>Result Cards &rarr;</a>
          <button onClick={() => load()} disabled={!secret || !examId || loading}
                  className="font-bold px-5 py-2.5 rounded-lg disabled:opacity-40"
                  style={{ background: GOLD, color: NAVY }}>
            {loading ? "Loading…" : data ? "Refresh" : "Show proformas"}
          </button>
          {data && (
            <>
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Download</label>
                <select className="rounded-lg px-3 py-2.5 text-white border outline-none"
                        style={{ background: NAVY, borderColor: "#ffffff26" }}
                        value={dlClass} onChange={(e) => setDlClass(e.target.value)}>
                  <option value="">All classes</option>
                  {classesPresent.map((c) => (
                    <option key={c} value={c}>Class {c} only</option>
                  ))}
                </select>
              </div>
              <button onClick={download}
                      className="font-bold px-5 py-2.5 rounded-lg"
                      style={{ background: "#1DB954", color: NAVY }}>
                Download Excel
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-sm bg-red-500/10 border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-white/50">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)}
                       className="accent-[#FCB629]" />
                Auto-refresh every 30s
              </label>
              <span>Updated {new Date(data.generatedAt).toLocaleTimeString()}</span>
              <span>Pass mark: {PASS_PCT}%</span>
            </div>

            {/* Tabs: Proforma 1 + one per subject */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => setTab("p1")}
                      className="text-xs font-semibold px-3 py-2 rounded-lg border"
                      style={tab === "p1"
                        ? { background: GOLD, color: NAVY, borderColor: GOLD }
                        : { background: "transparent", color: GOLD, borderColor: `${GOLD}55` }}>
                Proforma 1 — Class/Section
              </button>
              {Object.keys(data.proforma2 || {}).map((s) => (
                <button key={s} onClick={() => setTab(s)}
                        className="text-xs font-semibold px-3 py-2 rounded-lg border"
                        style={tab === s
                          ? { background: GOLD, color: NAVY, borderColor: GOLD }
                          : { background: "transparent", color: GOLD, borderColor: `${GOLD}55` }}>
                  {s}
                </button>
              ))}
            </div>

            <div className="overflow-auto rounded-xl border max-h-[75vh]" style={{ borderColor: `${GOLD}33` }}>
              {tab === "p1" ? (
                <table className="min-w-full text-xs border-separate" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: NAVY }}>
                      {P1_HEADERS.map((h, idx) => (
                        <th key={h} className={idx < 3 ? nameCell : cell}
                            style={idx < 3
                              ? { ...bc, color: GOLD, ...stick(idx, NAVY, true) }
                              : { ...bc, color: GOLD, ...stickyHead }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.proforma1.map((r, i) => (
                      <tr key={r.className} style={{ background: rowBg(i) }}>
                        <td className={cell} style={{ ...bc, ...stick(0, rowBg(i)) }}>{r.sr}</td>
                        <td className={nameCell} style={{ ...bc, ...stick(1, rowBg(i)) }}>{r.incharge}</td>
                        <td className={nameCell} style={{ ...bc, ...stick(2, rowBg(i)) }}>{r.className}</td>
                        <td className={cell} style={bc}>{r.appeared}</td>
                        <td className={cell} style={bc}>{r.passed}</td>
                        <td className={cell} style={bc}>{num(r.passPct)}</td>
                        <td className={cell} style={bc}>{num(r.resultPct)}</td>
                        <td className={cell} style={bc}>{num(r.avgMarks)}</td>
                        <td className={cell} style={bc}>{num(r.totalMarks)}</td>
                        <td className={cell} style={bc}>{num(r.avgPct)}</td>
                        {["b90","b80","b70","b60","b50","b40","below40"].map((k) => (
                          <td key={k} className={cell} style={bc}>{r.bands[k]}</td>
                        ))}
                        <td className={cell} style={{ ...bc, color: GOLD }}>{r.above70}</td>
                        <td className={cell} style={bc}>{r.below70}</td>
                        <td className={cell} style={bc}>{r.diff70}</td>
                        <td className={cell} style={{ ...bc, color: GOLD }}>{num(r.above70Pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full text-xs border-separate" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: NAVY }}>
                      {P2_HEADERS.map((h, idx) => (
                        <th key={h} className={idx < 3 ? nameCell : cell}
                            style={idx < 3
                              ? { ...bc, color: GOLD, ...stick(idx, NAVY, true) }
                              : { ...bc, color: GOLD, ...stickyHead }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.proforma2[tab] || []).map((r, i) => (
                      <tr key={r.className} style={{ background: rowBg(i) }}>
                        <td className={cell} style={{ ...bc, ...stick(0, rowBg(i)) }}>{r.sr}</td>
                        <td className={nameCell} style={{ ...bc, ...stick(1, rowBg(i)) }}>{r.teacher}</td>
                        <td className={nameCell} style={{ ...bc, ...stick(2, rowBg(i)) }}>{r.className}</td>
                        <td className={cell} style={bc}>{r.appeared}</td>
                        <td className={cell} style={bc}>{r.passed}</td>
                        <td className={cell} style={bc}>{num(r.passPct)}</td>
                        <td className={cell} style={bc}>{num(r.resultPct)}</td>
                        <td className={cell} style={bc}>{num(r.totalMarks)}</td>
                        <td className={cell} style={bc}>{num(r.avgMarks)}</td>
                        <td className={cell} style={bc}>{num(r.avgPct)}</td>
                        {["b90","b80","b70","b60","b50","b40","b33","below33"].map((k) => (
                          <td key={k} className={cell} style={bc}>{r.bands[k]}</td>
                        ))}
                        <td className={cell} style={{ ...bc, color: GOLD }}>{r.above70}</td>
                        <td className={cell} style={bc}>{r.below70}</td>
                        <td className={cell} style={bc}>{r.diff70}</td>
                        <td className={cell} style={{ ...bc, color: GOLD }}>{num(r.above70Pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <p className="text-[11px] text-white/40 mt-4">
              Built live from the award lists — a section appears here as soon as a teacher saves
              a subject for it, and the figures move as more subjects are entered. Only students
              with at least one mark count as “appeared”.
              <br />
              The Excel download matches the official proforma layout: Proforma 1 on one sheet
              per class, then Proforma 2 on a sheet per subject, with the formulas left live so
              the totals recalculate if anything is edited by hand.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
