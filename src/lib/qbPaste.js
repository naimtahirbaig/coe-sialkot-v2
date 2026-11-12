// Turns text that a teacher typed or pasted (from Word, a PDF, a chat ...) into separate questions.
// Safe to import from browser code. Rules are deliberately forgiving:
//   * Questions are separated by an empty line, or each one starts with a number (1.  2)  Q3:  Question No.4 :)
//   * MCQ options start with a) b) c) d)  or  (a) (b) ...  or  A. B. ...  (on their own lines or all on one line)
//   * The right answer: put * at the start or end of the option, or add a line  Answer: B
//   * For short / long / fill-in-the-blank, a line  Answer: ...  becomes the model answer
//   * If a text has no empty lines and no numbers, every line is one question (switch off with oneLine = false)

const NUM = /^\s*(?:Q(?:uestion)?\.?\s*(?:No\.?)?\s*)?\d{1,3}\s*[\).:\-]\s*/i;
const OPT = /^\s*\(?([a-dA-D])[\).:]\s*(.*)$/;
const ANS = /^\s*(?:correct\s*)?(?:ans(?:wer)?|key)\s*[:=\-]\s*\(?\s*(.+?)\s*\)?\s*$/i;

export function splitQuestions(text, { qtype = "short", oneLine } = {}) {
  const lines = String(text || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+$/, ""));
  let blocks = [], cur = [];
  for (const l of lines) {
    if (!l.trim()) { if (cur.length) { blocks.push(cur); cur = []; } } else cur.push(l);
  }
  if (cur.length) blocks.push(cur);

  // a block holding several numbered lines is several questions
  const out = [];
  for (const b of blocks) {
    const idx = b.map((l, i) => (NUM.test(l) && !OPT.test(l) ? i : -1)).filter((i) => i >= 0);
    if (idx.length >= 2) {
      idx.forEach((start, k) => out.push(b.slice(start, k + 1 < idx.length ? idx[k + 1] : b.length)));
      if (idx[0] > 0) out.unshift(b.slice(0, idx[0]));
    } else out.push(b);
  }
  // no blank lines, no numbers: one question per line (not for MCQs, whose options sit on separate lines)
  const auto = qtype !== "mcq" && out.length === 1 && out[0].length > 1 && !out[0].some((l) => NUM.test(l));
  if ((oneLine === undefined ? auto : oneLine && qtype !== "mcq") && out.length === 1) return out[0].map((l) => [l]);
  return out;
}

function parseMcq(block) {
  const stem = [], opts = ["", "", "", ""];
  let correct = "", last = -1;
  for (let raw of block) {
    let line = raw;
    const am = ANS.exec(line);
    if (am && /^[a-d]$/i.test(am[1].replace(/[()\s.]/g, ""))) { correct = am[1].replace(/[()\s.]/g, "").toUpperCase(); continue; }
    // several options on one line:  (a) x  (b) y  (c) z  (d) w
    const marks = [...line.matchAll(/(?:^|\s)\(?([a-dA-D])[\).]\s+/g)];
    if (marks.length >= 3 && /^\s*\(?[aA][\).]/.test(line)) {
      marks.forEach((m, k) => {
        const from = m.index + m[0].length, to = k + 1 < marks.length ? marks[k + 1].index : line.length;
        const i = "ABCD".indexOf(m[1].toUpperCase());
        let v = line.slice(from, to).trim();
        if (/^\*|\*$/.test(v)) { correct = "ABCD"[i]; v = v.replace(/^\*+|\*+$/g, "").trim(); }
        opts[i] = v;
      });
      last = 3; continue;
    }
    const om = OPT.exec(line);
    if (om && (last >= 0 || "ABCD".indexOf(om[1].toUpperCase()) === 0 || stem.length)) {
      const i = "ABCD".indexOf(om[1].toUpperCase());
      let v = om[2].trim();
      if (/^\*|\*$/.test(v)) { correct = "ABCD"[i]; v = v.replace(/^\*+|\*+$/g, "").trim(); }
      opts[i] = v; last = i; continue;
    }
    if (last >= 0 && line.trim() && !NUM.test(line)) { opts[last] = (opts[last] + " " + line.trim()).trim(); continue; } // wrapped option
    stem.push(line);
  }
  const first = stem.findIndex((l) => l.trim());
  if (first >= 0) stem[first] = stem[first].replace(NUM, "");
  return { qtype: "mcq", text: stem.join("\n").trim(), opts, correct, answer: "" };
}

function parseOther(block, qtype) {
  const body = [];
  let answer = "", correct = "";
  for (const line of block) {
    const am = ANS.exec(line);
    if (am) { if (qtype === "true_false") { const v = am[1].toLowerCase(); correct = v.startsWith("t") ? "True" : v.startsWith("f") ? "False" : ""; } else answer = am[1]; continue; }
    body.push(line);
  }
  const first = body.findIndex((l) => l.trim());
  if (first >= 0) body[first] = body[first].replace(NUM, "");
  return { qtype, text: body.join("\n").trim(), opts: ["", "", "", ""], correct, answer };
}

// -> [{ qtype, text, opts[4], correct, answer }]
export function parseBulk(text, qtype, oneLine) {
  return splitQuestions(text, { qtype, oneLine })
    .map((b) => (qtype === "mcq" ? parseMcq(b) : parseOther(b, qtype)))
    .filter((q) => q.text);
}
