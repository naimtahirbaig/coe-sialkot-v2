"use client";
import { useState } from "react";
import { C, card, btn, th, td, Msg, api } from "./ui";

const COLUMNS = ["class", "subject", "chapter", "section", "type", "question", "option_a", "option_b", "option_c", "option_d", "correct", "answer", "difficulty"];
// chapter: write it as "Ch 3: Algebra". section: English / Urdu only (leave empty for other subjects).
const SAMPLE = [
  ["9", "Mathematics", "Ch 2: Algebra", "", "mcq", "What is 7 x 8?", "54", "56", "58", "64", "B", "", "easy"],
  ["9", "Mathematics", "Ch 2: Algebra", "", "short", "Define a prime number.", "", "", "", "", "", "A number greater than 1 with exactly two factors.", "easy"],
  ["9", "Mathematics", "Ch 2: Algebra", "", "long", "Solve x^2 - 5x + 6 = 0 by factorisation.", "", "", "", "", "", "x = 2 or x = 3", "medium"],
  ["8", "English", "Ch 4: Parts of Speech", "Grammar & Vocabulary (MCQs)", "mcq", "Choose the noun: ", "run", "table", "quickly", "and", "B", "", "easy"],
];

const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// Small CSV reader: quotes, escaped quotes, commas or semicolons (Excel in some countries).
function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const first = text.split(/\r?\n/)[0] || "";
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  return rows.filter((r) => r.some((c) => c.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
}

export default function ImportTab({ onImported }) {
  const [msg, setMsg] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  function template() {
    const csv = "﻿" + [COLUMNS, ...SAMPLE].map((r) => r.map(esc).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "question_import_template.csv";
    a.click();
  }

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null); setRes(null); setBusy(true);
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error("The file has no rows. Save your sheet as CSV and try again.");
      if (!("question" in rows[0]) || !("type" in rows[0])) throw new Error("The first row must have the template's column names (class, subject, chapter, type, question, ...).");
      setRes(await api("/api/qb/questions/import", { method: "POST", body: { rows } }));
      onImported();
    } catch (err) { setMsg({ type: "err", text: err.message }); }
    setBusy(false);
  }

  return (
    <div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Bulk import from a spreadsheet</h2>
        <p>Fill in Excel or Google Sheets, save as <b>CSV</b>, then choose the file. Up to 1000 rows at a time.</p>
        <button style={btn(false)} onClick={template}>Download template</button>{" "}
        <label style={{ ...btn(!busy), display: "inline-block" }}>{busy ? "Importing…" : "Choose CSV file"}
          <input type="file" accept=".csv,text/csv" onChange={pick} style={{ display: "none" }} disabled={busy} /></label>
        <p style={{ color: C.MUTED, fontSize: 13 }}>
          <b>class</b>: 1–12 (or “Class 9”). <b>type</b>: mcq, short, long, true_false or fill_blank. For MCQs put the letter A–D in <b>correct</b>; for true/false put True or False.
        </p>
      </div>
      <Msg m={msg} />
      {res && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>{res.imported} question{res.imported === 1 ? "" : "s"} imported</h3>
          {res.errors.length > 0 && (
            <>
              <p>{res.errors.length} row{res.errors.length === 1 ? "" : "s"} skipped. Fix just those rows and import them again.</p>
              <table style={{ borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>CSV row</th><th style={th}>Problem</th></tr></thead>
                <tbody>{res.errors.map((e) => <tr key={e.row}><td style={td}>{e.row}</td><td style={td}>{e.message}</td></tr>)}</tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
