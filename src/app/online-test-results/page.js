"use client";
import { useState } from "react";

const TESTS = [
  { slug: "oct-2026-class-8-geography-ch3", label: "Class 8th — Geography Chapter 3 (October 2026)" },
];

const navy = "#150F3F", gold = "#F3B129", green = "#007a3a", red = "#B3261E";
const th = { textAlign: "left", padding: "8px 10px", background: navy, color: "#fff", fontSize: 12.5, whiteSpace: "nowrap" };
const td = { padding: "8px 10px", borderBottom: "1px solid #e3e1ee", fontSize: 14, verticalAlign: "middle" };
const btn = { padding: "6px 12px", borderRadius: 6, border: `1px solid ${navy}`, background: "#fff", color: navy, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnGo = { ...btn, background: navy, color: "#fff" };

function notes(r) {
  const n = [];
  if (r.tab_switches > 0) n.push(`left window ${r.tab_switches}×`);
  if (r.camera_dropped) n.push("camera stopped");
  return n.join(", ") || "none";
}

export default function OnlineTestResults() {
  const [pw, setPw] = useState("");
  const [test, setTest] = useState(TESTS[0].slug);
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState(null); // { url, row }

  async function load(e) {
    e && e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`/api/online-test/results?test=${encodeURIComponent(test)}`, {
        headers: { "x-admin-password": pw }, cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setRows(j.results);
    } catch (err) { setRows(null); setMsg(err.message); }
    setBusy(false);
  }

  async function cardJpeg(row) {
    const r = await fetch(`/api/online-test/card?id=${row.id}`, { headers: { "x-admin-password": pw }, cache: "no-store" });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "No card saved"); }
    return await r.blob();
  }
  function loadImg(blob) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(blob), im = new Image();
      im.onload = () => res({ im, url }); im.onerror = () => rej(new Error("Bad image"));
      im.src = url;
    });
  }
  async function cardPng(row) {
    const { im, url } = await loadImg(await cardJpeg(row));
    const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
    c.getContext("2d").drawImage(im, 0, 0); URL.revokeObjectURL(url);
    return await new Promise((res) => c.toBlob(res, "image/png"));
  }
  const fileBase = (r) => `ResultCard_${r.section_label.replace(/\s+/g, "")}_${r.roll_no}_${r.student_name.replace(/\s+/g, "")}`;
  function save(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  async function view(row) {
    try { setMsg(""); setCard({ url: URL.createObjectURL(await cardJpeg(row)), row }); } catch (err) { setMsg(`${row.student_name}: ${err.message}`); }
  }
  async function download(row) {
    try { save(await cardPng(row), fileBase(row) + ".png"); } catch (err) { setMsg(`${row.student_name}: ${err.message}`); }
  }
  async function bulk(kind, sec, list) {
    const done = list.filter((r) => r.status === "submitted");
    if (!done.length) { setMsg(`Class ${sec}: no finished results yet.`); return; }
    setBusy(true); setMsg("");
    try {
      if (kind === "png") {
        const JSZip = (await import("jszip")).default, zip = new JSZip();
        for (let i = 0; i < done.length; i++) {
          setMsg(`Class ${sec}: preparing card ${i + 1} of ${done.length}…`);
          zip.file(fileBase(done[i]) + ".png", await cardPng(done[i]));
        }
        save(await zip.generateAsync({ type: "blob" }), `ResultCards_Class${sec.replace(/\s+/g, "")}_PNG.zip`);
      } else {
        const { jsPDF } = await import("jspdf");
        let doc = null;
        for (let i = 0; i < done.length; i++) {
          setMsg(`Class ${sec}: adding card ${i + 1} of ${done.length}…`);
          const { im, url } = await loadImg(await cardJpeg(done[i]));
          const w = 595, h = Math.round((595 * im.naturalHeight) / im.naturalWidth);
          if (!doc) doc = new jsPDF({ unit: "pt", format: [w, h], compress: true });
          else doc.addPage([w, h]);
          doc.addImage(im, "JPEG", 0, 0, w, h);
          URL.revokeObjectURL(url);
        }
        doc.save(`ResultCards_Class${sec.replace(/\s+/g, "")}.pdf`);
      }
      setMsg(`Class ${sec}: ${done.length} card${done.length > 1 ? "s" : ""} downloaded.`);
    } catch (err) { setMsg(`Class ${sec}: ${err.message}`); }
    setBusy(false);
  }
  async function reset(row) {
    if (!window.confirm(`Delete ${row.student_name}'s attempt (${row.status})? They will be able to take the test again.`)) return;
    const r = await fetch("/api/online-test/reset", {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ id: row.id }),
    });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || "Reset failed"); return; }
    setRows((rs) => rs.filter((x) => x.id !== row.id));
  }
  async function excel() {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => ({
      Section: r.section_label, "Roll No": r.roll_no, Student: r.student_name, Teacher: r.teacher_name,
      Status: r.status === "submitted" ? "Submitted" : "Not finished",
      Correct: r.correct, Wrong: r.wrong, Skipped: r.skipped, "Percentage": r.percentage, Grade: r.grade,
      "Proctor notes": r.status === "submitted" ? notes(r) : "",
      Started: r.started_at ? new Date(r.started_at).toLocaleString("en-GB") : "",
      Finished: r.finished_at ? new Date(r.finished_at).toLocaleString("en-GB") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `OnlineTest_${test}.xlsx`);
  }

  const sections = {};
  (rows || []).forEach((r) => { (sections[r.section_label] ||= []).push(r); });
  const names = Object.keys(sections).sort();
  const submitted = (rows || []).filter((r) => r.status === "submitted").length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "system-ui, sans-serif", color: navy }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 26 }}>Online test results</h1>
      <div style={{ height: 4, width: 60, background: gold, marginBottom: 18 }} />

      <form onSubmit={load} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 14 }}>
        <label style={{ fontSize: 13 }}>Test<br />
          <select value={test} onChange={(e) => setTest(e.target.value)} style={{ padding: 8, minWidth: 280 }}>
            {TESTS.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13 }}>Admin password<br />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ padding: 8 }} autoComplete="off" />
        </label>
        <button type="submit" style={btnGo} disabled={busy || !pw}>{busy ? "Loading…" : "Show results"}</button>
        {rows && <button type="button" style={btn} onClick={excel}>Download Excel</button>}
      </form>

      {msg && <p style={{ color: /preparing|adding|downloaded/.test(msg) ? green : red, fontWeight: 600 }}>{msg}</p>}
      {rows && (
        <p style={{ fontSize: 14 }}>
          <b>{submitted}</b> submitted · <b>{rows.length - submitted}</b> not finished (started, but the page was closed) · {rows.length} in total
        </p>
      )}
      {rows && rows.length === 0 && <p>No one has taken this test yet.</p>}

      {names.map((n) => (
        <div key={n} style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", margin: "18px 0 8px" }}>
            <h2 style={{ fontSize: 18, margin: 0, borderLeft: `6px solid ${gold}`, paddingLeft: 10, marginRight: "auto" }}>Class {n}</h2>
            <button style={btn} disabled={busy} onClick={() => bulk("png", n, sections[n])}>Bulk PNG (zip)</button>
            <button style={btn} disabled={busy} onClick={() => bulk("pdf", n, sections[n])}>Bulk PDF</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 820 }}>
              <thead><tr>
                {["Roll", "Student", "Teacher", "Marks (✓ / ✗ / –)", "%", "Grade", "Proctor notes", ""].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {sections[n].map((r) => {
                  const ok = r.status === "submitted";
                  return (
                    <tr key={r.id}>
                      <td style={td}>{r.roll_no}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.student_name}</td>
                      <td style={td}>{r.teacher_name}</td>
                      <td style={td}>{ok ? `${r.correct} / ${r.wrong} / ${r.skipped}` : <span style={{ color: red }}>Not finished</span>}</td>
                      <td style={td}>{ok ? `${r.percentage}%` : ""}</td>
                      <td style={{ ...td, fontWeight: 700, color: ok && r.grade === "F" ? red : green }}>{ok ? r.grade : ""}</td>
                      <td style={td}>{ok ? notes(r) : ""}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        {ok && <><button style={btn} onClick={() => view(r)}>View card</button>{" "}
                        <button style={btn} onClick={() => download(r)}>PNG</button>{" "}</>}
                        <button style={{ ...btn, color: red, borderColor: red }} onClick={() => reset(r)}>Reset</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {card && (
        <div onClick={() => { URL.revokeObjectURL(card.url); setCard(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(10,8,30,.85)", overflow: "auto", padding: 16, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, margin: "0 auto", background: "#fff", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <b>{card.row.student_name} — Class {card.row.section_label}</b>
              <span>
                <button style={btn} onClick={() => download(card.row)}>PNG</button>{" "}
                <button style={btnGo} onClick={() => { URL.revokeObjectURL(card.url); setCard(null); }}>Close</button>
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.url} alt="Result card" style={{ width: "100%", height: "auto" }} />
          </div>
        </div>
      )}
    </div>
  );
}
