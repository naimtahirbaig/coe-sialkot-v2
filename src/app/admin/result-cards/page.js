"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { examLabel } from "@/lib/awardListExams";
import { colourForSection, SIZES, BASE_W, BASE_H } from "@/lib/resultCardConfig";
import { drawResultCard, loadImage } from "@/lib/resultCardRenderer";

const NAVY = "#150F3F";
const NAVY_LIGHT = "#1F1760";
const GOLD = "#FCB629";

export default function ResultCardsPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [sections, setSections] = useState([]);
  const [code, setCode] = useState("");
  const [style, setStyle] = useState("colour");
  const [size, setSize] = useState("4k");
  const [data, setData] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef(null);
  const logosRef = useRef(null);

  useEffect(() => {
    fetch("/api/award-list/exams").then((r) => r.json()).then((d) => {
      setExams(d.exams || []);
      if (d.current) setExamId(d.current.id);
    }).catch(() => setError("Could not load exams."));
    fetch("/api/award-list/sections").then((r) => r.json())
      .then((d) => setSections(d.sections || []));
  }, []);

  async function getLogos() {
    if (logosRef.current) return logosRef.current;
    const [authority, punjab] = await Promise.all([
      loadImage("/coe-logo.png"),
      loadImage("/punjab-logo.png"),
    ]);
    logosRef.current = { authority, punjab };
    return logosRef.current;
  }

  async function load() {
    if (!adminPassword || !code || !examId) return;
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(
        `/api/award-list/result-cards?code=${encodeURIComponent(code)}&examId=${encodeURIComponent(examId)}&adminPassword=${encodeURIComponent(adminPassword)}`
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not load");
      setData(d);
      setStudentId(d.cards[0]?.studentId || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Draw one card at the given scale onto a fresh canvas
  const render = useCallback(async (card, scale) => {
    const logos = await getLogos();
    const cv = document.createElement("canvas");
    cv.width = Math.round(BASE_W * scale);
    cv.height = Math.round(BASE_H * scale);
    const ctx = cv.getContext("2d");
    ctx.scale(scale, scale);
    drawResultCard(ctx, card, {
      accent: colourForSection(data.section.section_label),
      style, logos,
    });
    return cv;
  }, [data, style]);

  // Live preview of the selected student
  useEffect(() => {
    if (!data || !studentId) return;
    const card = data.cards.find((c) => c.studentId === studentId);
    if (!card) return;
    let cancelled = false;
    (async () => {
      const cv = await render(card, 1);
      if (cancelled) return;
      const host = previewRef.current;
      if (host) { host.innerHTML = ""; cv.style.width = "100%"; cv.style.height = "auto"; host.appendChild(cv); }
    })();
    return () => { cancelled = true; };
  }, [data, studentId, style, render]);

  function fileStem(card) {
    const sec = String(data.section.section_label).split("(")[0].trim();
    return `${data.section.class}-${sec}-${card.roll}-${card.name}`.replace(/[^\w\-]+/g, "-");
  }

  async function downloadOnePng() {
    const card = data.cards.find((c) => c.studentId === studentId);
    if (!card) return;
    setBusy("Rendering…");
    try {
      const cv = await render(card, SIZES[size].scale);
      cv.toBlob((blob) => {
        saveBlob(blob, `${fileStem(card)}.png`);
        setBusy("");
      }, "image/png");
    } catch (e) { setError(e.message); setBusy(""); }
  }

  async function downloadOnePdf() {
    const card = data.cards.find((c) => c.studentId === studentId);
    if (!card) return;
    setBusy("Building PDF…");
    try {
      const { jsPDF } = await import("jspdf");
      const cv = await render(card, SIZES[size].scale);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      pdf.addImage(cv.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pw, ph);
      pdf.save(`${fileStem(card)}.pdf`);
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  async function downloadSectionPdf() {
    setBusy("Building section PDF…");
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < data.cards.length; i++) {
        setBusy(`Building section PDF… ${i + 1}/${data.cards.length}`);
        const cv = await render(data.cards[i], SIZES[size].scale);
        if (i > 0) pdf.addPage();
        pdf.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, ph);
        cv.width = 0; cv.height = 0;            // release memory between pages
        await new Promise((r) => setTimeout(r, 0));
      }
      const sec = String(data.section.section_label).split("(")[0].trim();
      pdf.save(`Result-Cards-${data.section.class}-${sec}.pdf`);
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  async function downloadSectionPngZip() {
    setBusy("Building ZIP…");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < data.cards.length; i++) {
        setBusy(`Rendering… ${i + 1}/${data.cards.length}`);
        const card = data.cards[i];
        const cv = await render(card, SIZES[size].scale);
        const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
        zip.file(`${fileStem(card)}.png`, blob);
        cv.width = 0; cv.height = 0;
        await new Promise((r) => setTimeout(r, 0));
      }
      setBusy("Compressing…");
      const out = await zip.generateAsync({ type: "blob" });
      const sec = String(data.section.section_label).split("(")[0].trim();
      saveBlob(out, `Result-Cards-${data.section.class}-${sec}-PNG.zip`);
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  // Send the card straight to the printer at A4, no download step.
  async function printCard() {
    const card = data.cards.find((c) => c.studentId === studentId);
    if (!card) return;
    setBusy("Preparing…");
    try {
      const cv = await render(card, SIZES.print.scale);
      const src = cv.toDataURL("image/png");
      const w = window.open("", "_blank", "noopener,width=900,height=1200");
      if (!w) { setError("Your browser blocked the print window. Allow pop-ups for this site."); setBusy(""); return; }
      w.document.write(`<!doctype html><html><head><title>${card.name} — Result Card</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          html,body { margin:0; padding:0; }
          img { width:100%; height:auto; display:block; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style></head><body><img src="${src}" onload="window.focus();window.print();"></body></html>`);
      w.document.close();
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  // Print every card in the section as one job, one card per A4 page.
  async function printSection() {
    setBusy("Preparing…");
    try {
      const imgs = [];
      for (let i = 0; i < data.cards.length; i++) {
        setBusy(`Preparing… ${i + 1}/${data.cards.length}`);
        const cv = await render(data.cards[i], SIZES.print.scale);
        imgs.push(cv.toDataURL("image/jpeg", 0.92));
        cv.width = 0; cv.height = 0;
        await new Promise((r) => setTimeout(r, 0));
      }
      const w = window.open("", "_blank", "noopener,width=900,height=1200");
      if (!w) { setError("Your browser blocked the print window. Allow pop-ups for this site."); setBusy(""); return; }
      const sec = String(data.section.section_label).split("(")[0].trim();
      w.document.write(`<!doctype html><html><head><title>Result Cards — ${data.section.class} ${sec}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          html,body { margin:0; padding:0; }
          img { width:100%; height:auto; display:block; page-break-after: always; }
          img:last-child { page-break-after: auto; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style></head><body>${imgs.map((s2) => `<img src="${s2}">`).join("")}
        <script>window.onload=function(){window.focus();window.print();}<\/script>
        </body></html>`);
      w.document.close();
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const incomplete = data ? data.cards.filter((c) => !c.complete).length : 0;
  const inputCls = "rounded-lg px-3 py-2.5 text-white border outline-none";
  const inputStyle = { background: NAVY, borderColor: "#ffffff26" };

  return (
    <div className="min-h-screen text-white"
         style={{ background: `radial-gradient(circle at top, ${NAVY_LIGHT}, #0A0826 60%)` }}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        <div className="flex items-center gap-4 rounded-2xl p-5 md:p-6 mb-6 shadow-xl border"
             style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`, borderColor: `${GOLD}33` }}>
          <img src="/coe-logo.png" alt="" className="h-14 w-14 md:h-16 md:w-16 rounded-full ring-2 shrink-0"
               style={{ ["--tw-ring-color"]: GOLD }} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Result Cards</h1>
            <p className="text-xs md:text-sm uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              Centre of Excellence Sialkot
            </p>
          </div>
        </div>

        <a href="/admin/exams" className="inline-block text-sm mb-4 underline" style={{ color: GOLD }}>
          &larr; All exams
        </a>

        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Admin password</label>
            <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                   name="rc-admin" autoComplete="off" data-1p-ignore data-lpignore="true"
                   className={`${inputCls} w-52 placeholder-white/40`} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Exam</label>
            <select className={inputCls} style={inputStyle} value={examId}
                    onChange={(e) => setExamId(e.target.value)}>
              {exams.map((e) => <option key={e.id} value={e.id}>{examLabel(e)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Section</label>
            <select className={inputCls} style={inputStyle} value={code}
                    onChange={(e) => setCode(e.target.value)}>
              <option value="">Select…</option>
              {sections.map((s) => (
                <option key={s.sheet_code} value={s.sheet_code}>
                  Class {s.class} — {s.section_label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={load} disabled={!adminPassword || !code || loading}
                  className="font-bold px-5 py-2.5 rounded-lg disabled:opacity-40"
                  style={{ background: GOLD, color: NAVY }}>
            {loading ? "Loading…" : "Load section"}
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-sm bg-red-500/10 border-red-500/40 text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="flex flex-wrap gap-3 items-end mb-4">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Style</label>
                <div className="flex gap-2">
                  {[["colour", "Colourful"], ["ink", "Ink-friendly"]].map(([v, l]) => (
                    <button key={v} onClick={() => setStyle(v)}
                            className="text-sm font-semibold px-3 py-2.5 rounded-lg border"
                            style={style === v
                              ? { background: GOLD, color: NAVY, borderColor: GOLD }
                              : { background: "transparent", color: GOLD, borderColor: `${GOLD}55` }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Resolution</label>
                <select className={inputCls} style={inputStyle} value={size}
                        onChange={(e) => setSize(e.target.value)}>
                  {Object.entries(SIZES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Student</label>
                <select className={inputCls} style={inputStyle} value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}>
                  {data.cards.map((c) => (
                    <option key={c.studentId} value={c.studentId}>
                      {c.roll} · {c.name}{c.complete ? "" : " (incomplete)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {incomplete > 0 && (
              <div className="mb-4 px-4 py-3 rounded-lg border text-sm bg-amber-500/10 border-amber-500/40 text-amber-300">
                {incomplete} of {data.cards.length} students do not yet have marks in all{" "}
                {data.subjectCount} subjects. Their cards will print with “—” for the missing
                subjects, and their percentage is based only on what has been entered.
              </div>
            )}

            <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
              <div className="rounded-xl overflow-hidden border bg-white"
                   style={{ borderColor: `${GOLD}33` }} ref={previewRef} />

              <div className="space-y-3">
                <div className="rounded-xl border p-4" style={{ borderColor: `${GOLD}33`, background: "#ffffff06" }}>
                  <h3 className="font-bold mb-3" style={{ color: GOLD }}>This student</h3>
                  <button onClick={printCard} disabled={!!busy}
                          className="w-full mb-2 font-bold px-4 py-2.5 rounded-lg border disabled:opacity-40"
                          style={{ borderColor: "#ffffff33", color: "#fff", background: "transparent" }}>
                    Print
                  </button>
                  <button onClick={downloadOnePng} disabled={!!busy}
                          className="w-full mb-2 font-bold px-4 py-2.5 rounded-lg disabled:opacity-40"
                          style={{ background: GOLD, color: NAVY }}>
                    Download PNG
                  </button>
                  <button onClick={downloadOnePdf} disabled={!!busy}
                          className="w-full font-bold px-4 py-2.5 rounded-lg disabled:opacity-40"
                          style={{ background: "#1DB954", color: NAVY }}>
                    Download PDF
                  </button>
                </div>

                <div className="rounded-xl border p-4" style={{ borderColor: `${GOLD}33`, background: "#ffffff06" }}>
                  <h3 className="font-bold mb-1" style={{ color: GOLD }}>
                    Whole section
                  </h3>
                  <p className="text-xs text-white/50 mb-3">{data.cards.length} students</p>
                  <button onClick={downloadSectionPdf} disabled={!!busy}
                          className="w-full mb-2 font-bold px-4 py-2.5 rounded-lg disabled:opacity-40"
                          style={{ background: "#1DB954", color: NAVY }}>
                    Download PDF (all)
                  </button>
                  <button onClick={downloadSectionPngZip} disabled={!!busy}
                          className="w-full mb-2 font-bold px-4 py-2.5 rounded-lg disabled:opacity-40"
                          style={{ background: GOLD, color: NAVY }}>
                    Download PNGs (ZIP)
                  </button>
                  <button onClick={printSection} disabled={!!busy}
                          className="w-full font-bold px-4 py-2.5 rounded-lg border disabled:opacity-40"
                          style={{ borderColor: "#ffffff33", color: "#fff", background: "transparent" }}>
                    Print all
                  </button>
                </div>

                {busy && (
                  <div className="rounded-lg px-4 py-3 text-sm border"
                       style={{ borderColor: `${GOLD}55`, color: GOLD, background: `${GOLD}14` }}>
                    {busy}
                  </div>
                )}

                <p className="text-[11px] text-white/40 leading-relaxed">
                  Cards are drawn in your browser, so nothing is uploaded anywhere.
                  A whole section at 4K takes a minute or two and a large PDF —
                  choose Print 300 DPI for a smaller file that still prints sharply.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
