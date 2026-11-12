// Question Bank: everything that talks to the database. `sb` is a Supabase client, passed in
// so the same code can be tested against a fake one.
import bcrypt from "bcryptjs";
import { fetchAll } from "@/lib/fetchAll";
import {
  QTYPES, DIFFICULTIES, PER_PAGE, MAX_IMPORT_ROWS, QbError, fmtNum,
  parseQuestion, parseImportRow, parsePaperSpec, chooseIds, cleanImage, parseClassNum, signToken, verifyToken, safeEqual,
} from "@/lib/questionBank";
import { PART_QTYPES, PART_TYPES, SCHOOL_LINE, LOGO } from "@/lib/qbFormats";

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const cleanStr = (v, n) => String(v ?? "").trim().slice(0, n);

// ------------------------------------------------------------------ auth
export async function login(sb, { username, password }) {
  const u = String(username || "").trim().toLowerCase();
  const p = String(password || "");
  if (!u || !p) throw new QbError(400, "Enter your username and password.");
  if (u === "admin") {
    if (!process.env.ADMIN_PASSWORD || !safeEqual(p, process.env.ADMIN_PASSWORD)) throw new QbError(401, "Wrong username or password.");
    const user = { role: "admin", id: null, name: "Admin" };
    return { token: signToken(user), user };
  }
  const t = must(await sb.from("qb_teachers").select("id, username, name, password_hash, active").eq("username", u).maybeSingle());
  // compare even when the user does not exist, so timing doesn't reveal which usernames exist
  const ok = await bcrypt.compare(p, t?.password_hash || "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi");
  if (!t || !ok || !t.active) throw new QbError(401, "Wrong username or password.");
  const user = { role: "teacher", id: t.id, name: t.name };
  return { token: signToken(user), user };
}

// Returns the logged-in user or null. Teachers are re-checked so disabling an account works at once.
export async function authenticate(req, sb) {
  const h = req.headers.get("authorization") || "";
  const p = verifyToken(h.startsWith("Bearer ") ? h.slice(7) : "");
  if (!p) return null;
  if (p.role === "admin") return { role: "admin", id: null, name: "Admin" };
  if (p.role !== "teacher") return null;
  const t = must(await sb.from("qb_teachers").select("id, name, active").eq("id", p.id).maybeSingle());
  return t && t.active ? { role: "teacher", id: t.id, name: t.name } : null;
}

// A teacher changes his own password (must know the current one).
export async function changeOwnPassword(sb, user, b) {
  if (user.role !== "teacher") throw new QbError(400, "The admin password is changed in the site settings, not here.");
  const cur = String(b.current || ""), next = String(b.next || "");
  if (next.length < 8) throw new QbError(400, "New password must be at least 8 characters.");
  if (next === cur) throw new QbError(400, "The new password must be different from the old one.");
  const t = must(await sb.from("qb_teachers").select("password_hash").eq("id", user.id).maybeSingle());
  if (!t || !(await bcrypt.compare(cur, t.password_hash))) throw new QbError(401, "Your current password is wrong.");
  must(await sb.from("qb_teachers").update({ password_hash: await bcrypt.hash(next, 10) }).eq("id", user.id));
  return { ok: true };
}

// ---------------------------------------------------------------- teachers
export async function listTeachers(sb) {
  const teachers = must(await sb.from("qb_teachers").select("id, username, name, active, created_at").order("name"));
  const counts = {};
  const qs = await fetchAll((o) => sb.from("qb_questions").select("id, created_by", o).not("created_by", "is", null).order("id"));
  qs.forEach((q) => { counts[q.created_by] = (counts[q.created_by] || 0) + 1; });
  return { teachers: teachers.map((t) => ({ ...t, questions: counts[t.id] || 0 })) };
}

export async function addTeacher(sb, b) {
  const username = String(b.username || "").trim().toLowerCase();
  const name = String(b.name || "").trim().slice(0, 80);
  const password = String(b.password || "");
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new QbError(400, "Username: 3–30 letters, numbers, dot, dash or underscore.");
  if (username === "admin") throw new QbError(400, "That username is reserved.");
  if (!name) throw new QbError(400, "Enter the teacher's full name.");
  if (password.length < 8) throw new QbError(400, "Password must be at least 8 characters.");
  const { error } = await sb.from("qb_teachers").insert({ username, name, password_hash: await bcrypt.hash(password, 10) });
  if (error) throw new QbError(error.code === "23505" ? 409 : 500, error.code === "23505" ? "That username already exists." : error.message);
  return { ok: true };
}

export async function updateTeacher(sb, id, b) {
  const patch = {};
  if (typeof b.active === "boolean") patch.active = b.active;
  if (b.password != null) {
    if (String(b.password).length < 8) throw new QbError(400, "Password must be at least 8 characters.");
    patch.password_hash = await bcrypt.hash(String(b.password), 10);
  }
  if (!Object.keys(patch).length) throw new QbError(400, "Nothing to change.");
  must(await sb.from("qb_teachers").update(patch).eq("id", id));
  return { ok: true };
}

// --------------------------------------------------------------- questions
// the picture is left out of lists (it can be large); has_image says whether there is one
const LIST_COLS = "id, class_num, subject, chapter, qtype, text, opts, correct, answer, marks, difficulty, passage_id, has_image, created_by, created_by_name, created_at";

export async function listQuestions(sb, user, a) {
  const page = Math.max(1, parseInt(a.get("page"), 10) || 1);
  let q = sb.from("qb_questions").select(LIST_COLS, { count: "exact" });
  if (/^\d+$/.test(a.get("classNum") || "")) q = q.eq("class_num", Number(a.get("classNum")));
  if (a.get("subject")) q = q.eq("subject", a.get("subject"));
  if (QTYPES[a.get("qtype")]) q = q.eq("qtype", a.get("qtype"));
  if (DIFFICULTIES.includes(a.get("difficulty"))) q = q.eq("difficulty", a.get("difficulty"));
  if (a.get("mine")) q = user.role === "admin" ? q.is("created_by", null) : q.eq("created_by", user.id);
  const s = (a.get("search") || "").trim().replace(/[%_,()\\]/g, " ").slice(0, 60);
  if (s) q = q.ilike("text", `%${s}%`);
  const { data, error, count } = await q.order("id", { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (error) throw new Error(error.message);
  return {
    total: count || 0, page, pages: Math.max(1, Math.ceil((count || 0) / PER_PAGE)),
    rows: (data || []).map((r) => ({ ...r, canEdit: user.role === "admin" || r.created_by === user.id })),
  };
}

export async function getQuestion(sb, user, id) {
  const q = must(await sb.from("qb_questions").select("*").eq("id", id).maybeSingle());
  if (!q) throw new QbError(404, "Question not found.");
  return { question: { ...q, canEdit: user.role === "admin" || q.created_by === user.id } };
}

// a question may only point at a passage of the same class and subject
async function checkPassage(sb, d) {
  if (!d.passage_id) return;
  const p = must(await sb.from("qb_passages").select("id, class_num, subject").eq("id", d.passage_id).maybeSingle());
  if (!p || p.class_num !== d.class_num || p.subject !== d.subject) throw new QbError(400, "Choose a passage of the same class and subject.");
}

export async function createQuestion(sb, user, body) {
  const { errors, data } = parseQuestion(body);
  if (errors.length) throw new QbError(400, errors.join(" "));
  await checkPassage(sb, data);
  const { error } = await sb.from("qb_questions").insert({ ...data, created_by: user.id, created_by_name: user.name });
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function editable(sb, user, id) {
  const q = must(await sb.from("qb_questions").select("id, created_by").eq("id", id).maybeSingle());
  if (!q) throw new QbError(404, "Question not found.");
  if (user.role !== "admin" && q.created_by !== user.id) throw new QbError(403, "You can only change your own questions.");
}

export async function updateQuestion(sb, user, id, body) {
  await editable(sb, user, id);
  const { errors, data } = parseQuestion(body);
  if (errors.length) throw new QbError(400, errors.join(" "));
  await checkPassage(sb, data);
  must(await sb.from("qb_questions").update(data).eq("id", id));
  return { ok: true };
}

export async function deleteQuestion(sb, user, id) {
  await editable(sb, user, id);
  must(await sb.from("qb_questions").delete().eq("id", id));
  return { ok: true };
}

export async function importQuestions(sb, user, body) {
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) throw new QbError(400, "The file has no rows.");
  if (rows.length > MAX_IMPORT_ROWS) throw new QbError(400, `Import at most ${MAX_IMPORT_ROWS} rows at a time.`);
  const good = [], errors = [];
  rows.forEach((raw, i) => {
    if (!Object.values(raw || {}).some((v) => String(v ?? "").trim())) return;
    const { errors: e, data } = parseImportRow(raw);
    if (e.length) errors.push({ row: i + 2, message: e.join("; ") });
    else good.push({ ...data, created_by: user.id, created_by_name: user.name });
  });
  for (const part of chunk(good, 200)) must(await sb.from("qb_questions").insert(part));
  return { imported: good.length, errors };
}

export async function meta(sb) {
  const rows = await fetchAll((o) => sb.from("qb_questions").select("id, class_num, subject, chapter, qtype", o).order("id"));
  const subjects = [...new Set(rows.map((r) => r.subject))].sort();
  const chapters = {};
  const cover = {};
  rows.forEach((r) => {
    if (r.chapter) (chapters[`${r.class_num}|${r.subject}`] ||= new Set()).add(r.chapter);
    const k = `${r.class_num}|${r.subject}`;
    const c = (cover[k] ||= { classNum: r.class_num, subject: r.subject, counts: {}, total: 0 });
    c.counts[r.qtype] = (c.counts[r.qtype] || 0) + 1;
    c.total++;
  });
  return {
    total: rows.length, subjects,
    chapters: Object.fromEntries(Object.entries(chapters).map(([k, v]) => [k, [...v].sort()])),
    coverage: Object.values(cover).sort((a, b) => a.classNum - b.classNum || a.subject.localeCompare(b.subject)),
  };
}

// ---------------------------------------------------------------- passages
export async function listPassages(sb, a) {
  const classNum = parseClassNum(a.get("classNum"));
  const subject = cleanStr(a.get("subject"), 60);
  if (!classNum || !subject) return { passages: [] };
  const rows = must(await sb.from("qb_passages").select("*").eq("class_num", classNum).eq("subject", subject).order("id", { ascending: false }));
  return { passages: rows };
}

export async function createPassage(sb, user, b) {
  const classNum = parseClassNum(b.classNum), subject = cleanStr(b.subject, 60).replace(/\s+/g, " ");
  const text = cleanStr(b.text, 8000);
  const image = cleanImage(b.image);
  if (!classNum || !subject) throw new QbError(400, "Choose a class and a subject first.");
  if (!text) throw new QbError(400, "Type the passage text.");
  if (image === null) throw new QbError(400, "The picture must be a PNG, JPEG or WebP under 300 KB.");
  const row = must(await sb.from("qb_passages").insert({
    class_num: classNum, subject, chapter: cleanStr(b.chapter, 100), instruction: cleanStr(b.instruction, 500),
    text, image: image || "", created_by: user.id, created_by_name: user.name,
  }).select("*").single());
  return { passage: row };
}

export async function deletePassage(sb, user, id) {
  const p = must(await sb.from("qb_passages").select("id, created_by").eq("id", id).maybeSingle());
  if (!p) throw new QbError(404, "Passage not found.");
  if (user.role !== "admin" && p.created_by !== user.id) throw new QbError(403, "You can only delete your own passages.");
  must(await sb.from("qb_passages").delete().eq("id", id));
  return { ok: true };
}

// ------------------------------------------------------------ paper helpers
// Rows {id, passage_id} that match a slot in the paper.
async function candidateRows(sb, f) {
  return fetchAll((o) => {
    let q = sb.from("qb_questions").select("id, passage_id", o).eq("class_num", f.classNum).eq("subject", f.subject)
      .in("qtype", f.qtypes).eq("marks", f.marks);
    if (f.chapters?.length) q = q.in("chapter", f.chapters);
    if (DIFFICULTIES.includes(f.difficulty)) q = q.eq("difficulty", f.difficulty);
    return q.order("id");
  });
}

async function usedBefore(sb, classNum, subject) {
  const rows = must(await sb.from("qb_papers").select("qids").eq("class_num", classNum).eq("subject", subject));
  return new Set(rows.flatMap((r) => r.qids || []));
}

const snapshot = (q) => ({
  qid: q.id, qtype: q.qtype, chapter: q.chapter, text: q.text, opts: q.opts || [], correct: q.correct,
  answer: q.answer, image: q.image || "", marks: Number(q.marks), passageId: q.passage_id || null,
});

const bodyQids = (b) => [
  ...(b.partA?.plain || []), ...(b.partA?.passage?.questions || []), ...(b.partB || []).flatMap((blk) => blk.parts.map((p) => p.q)),
].map((q) => q.qid);

export async function availability(sb, a) {
  const classNum = Number(a.get("classNum")), marks = Number(a.get("marks"));
  const subject = a.get("subject") || "", kind = a.get("kind") || "crq";
  const qtypes = kind === "mcq" ? ["mcq"] : PART_QTYPES[kind];
  if (!classNum || !subject || !qtypes || !(marks > 0)) return { available: null };
  const rows = await candidateRows(sb, { classNum, subject, qtypes, marks, chapters: a.getAll("chapters"), difficulty: a.get("difficulty") || "" });
  const passages = {};
  rows.filter((r) => r.passage_id).forEach((r) => { passages[r.passage_id] = (passages[r.passage_id] || 0) + 1; });
  return {
    available: kind === "mcq" ? rows.filter((r) => !r.passage_id).length : rows.length,
    inPassages: kind === "mcq" ? Math.max(0, ...Object.values(passages)) : 0, // most MCQs any one passage has
  };
}

export async function generatePaper(sb, user, body) {
  const { errors, form, partA, partB } = parsePaperSpec(body);
  const fail = (list) => { throw new QbError(400, list.join(" ")); };
  if (errors.length) fail(errors);

  const used = await usedBefore(sb, form.classNum, form.subject);
  const taken = new Set();
  const problems = [];
  const base = { classNum: form.classNum, subject: form.subject, chapters: form.chapters, difficulty: form.difficulty };

  // ---- Part A: MCQs (optionally a reading passage with its own group of MCQs)
  let plainIds = [], passageId = null, passageIds = [];
  if (partA.count > 0) {
    const rows = await candidateRows(sb, { ...base, qtypes: ["mcq"], marks: partA.marks });
    const P = partA.passageSize;
    if (P > 0) {
      const groups = {};
      rows.filter((r) => r.passage_id).forEach((r) => { (groups[r.passage_id] ||= []).push(r.id); });
      const ok = Object.entries(groups).filter(([, ids]) => ids.length >= P);
      if (!ok.length) problems.push(`Part A: no reading passage has ${P} MCQs of ${fmtNum(partA.marks)} marks. Add more MCQs to a passage, or set passage questions to 0.`);
      else {
        const fresh = ok.filter(([, ids]) => ids.filter((i) => !used.has(i)).length >= P);
        const pool = fresh.length ? fresh : ok;
        const [pid, ids] = pool[Math.floor(Math.random() * pool.length)];
        passageId = Number(pid);
        passageIds = chooseIds(ids, used, taken, P).ids;
        passageIds.forEach((i) => taken.add(i));
      }
    }
    const need = partA.count - P;
    const plain = chooseIds(rows.filter((r) => !r.passage_id).map((r) => r.id), used, taken, need);
    if (plain.ids.length < need) problems.push(`Part A: need ${need} MCQs of ${fmtNum(partA.marks)} marks, but only ${plain.ids.length} available. Ask teachers to add more, or relax the filters.`);
    plainIds = plain.ids;
    plainIds.forEach((i) => taken.add(i));
  }

  // ---- Part B: constructed-response questions, one bank question per part
  const startNo = partA.count + 1;
  const bPicks = [];
  for (let i = 0; i < partB.length; i++) {
    const picks = [];
    for (let j = 0; j < partB[i].parts.length; j++) {
      const part = partB[i].parts[j];
      const rows = await candidateRows(sb, { ...base, qtypes: PART_QTYPES[part.qtype], marks: part.marks });
      const { ids } = chooseIds(rows.map((r) => r.id), used, taken, 1);
      if (!ids.length) problems.push(`Question ${startNo + i}, part ${j + 1}: no ${PART_TYPES[part.qtype]} question worth ${fmtNum(part.marks)} marks is available. Ask teachers to add one, or change the marks.`);
      ids.forEach((x) => taken.add(x));
      picks.push(ids[0] || null);
    }
    bPicks.push(picks);
  }
  if (problems.length) fail(problems);

  // ---- fetch the chosen rows and take a snapshot of each
  const all = [...taken];
  const rowById = {};
  for (const part of chunk(all, 100)) must(await sb.from("qb_questions").select("*").in("id", part)).forEach((r) => { rowById[r.id] = r; });
  let passage = null;
  if (passageId) {
    const p = must(await sb.from("qb_passages").select("*").eq("id", passageId).single());
    passage = { instruction: p.instruction, text: p.text, image: p.image || "", questions: passageIds.map((id) => snapshot(rowById[id])) };
  }
  const total = (n) => Number(n);
  const doc = {
    header: {
      title: form.title, gradeLabel: `GRADE-${form.classNum}`, subjectTitle: form.subjectTitle,
      school: form.school || SCHOOL_LINE, lang: form.lang, qr: form.qr, logo: LOGO,
    },
    partA: { count: partA.count, marksEach: total(partA.marks), plain: plainIds.map((id) => snapshot(rowById[id])), passage },
    partB: partB.map((blk, i) => ({
      no: startNo + i,
      parts: blk.parts.map((p, j) => ({ marks: p.marks, spec: p.qtype, q: snapshot(rowById[bPicks[i][j]]) })),
    })),
  };
  const created = must(await sb.from("qb_papers").insert({
    title: form.title, class_num: form.classNum, subject: form.subject, total_marks: form.totalMarks,
    filters: { chapters: form.chapters, difficulty: form.difficulty }, body: doc, qids: bodyQids(doc),
  }).select("id").single());
  return { id: created.id };
}

const paperOut = (p) => ({
  id: p.id, title: p.title, classNum: p.class_num, subject: p.subject, totalMarks: Number(p.total_marks),
  createdAt: p.created_at, filters: p.filters, body: p.body,
});

export async function listPapers(sb) {
  const rows = must(await sb.from("qb_papers").select("id, title, class_num, subject, total_marks, created_at").order("id", { ascending: false }));
  return { papers: rows.map((p) => ({ id: p.id, title: p.title, classNum: p.class_num, subject: p.subject, totalMarks: Number(p.total_marks), createdAt: p.created_at })) };
}

export async function getPaperRow(sb, id) {
  const p = must(await sb.from("qb_papers").select("*").eq("id", id).maybeSingle());
  if (!p) throw new QbError(404, "Paper not found.");
  return p;
}
export async function getPaper(sb, id) { return { paper: paperOut(await getPaperRow(sb, id)) }; }

export async function deletePaper(sb, id) {
  must(await sb.from("qb_papers").delete().eq("id", id));
  return { ok: true };
}

// path: ["A","plain",i] | ["A","passage",i] | ["B",blockIndex,partIndex]
export async function swapQuestion(sb, id, path) {
  const p = await getPaperRow(sb, id);
  const doc = p.body;
  const bad = () => { throw new QbError(404, "Question not found in this paper."); };
  if (!Array.isArray(path)) bad();
  let holder, key, qtypes, marks, passage;
  if (path[0] === "A" && path[1] === "plain") { holder = doc.partA.plain; key = path[2]; qtypes = ["mcq"]; marks = doc.partA.marksEach; passage = "none"; }
  else if (path[0] === "A" && path[1] === "passage" && doc.partA.passage) {
    holder = doc.partA.passage.questions; key = path[2]; qtypes = ["mcq"]; marks = doc.partA.marksEach; passage = holder[0]?.passageId;
  } else if (path[0] === "B") {
    const part = doc.partB?.[path[1]]?.parts?.[path[2]];
    if (!part) bad();
    holder = part; key = "q"; qtypes = PART_QTYPES[part.spec] || PART_QTYPES.crq; marks = part.marks; passage = "any";
  } else bad();
  const cur = holder?.[key];
  if (!cur) bad();

  const exclude = new Set(bodyQids(doc));
  const f = p.filters || {};
  const base = { classNum: p.class_num, subject: p.subject, qtypes, marks };
  const fits = (r) => (passage === "any" ? true : passage === "none" ? !r.passage_id : r.passage_id === passage);
  const used = await usedBefore(sb, p.class_num, p.subject);
  let note = "";
  let { ids } = chooseIds((await candidateRows(sb, { ...base, chapters: f.chapters, difficulty: f.difficulty })).filter(fits).map((r) => r.id), used, exclude, 1);
  if (!ids.length && (f.chapters?.length || f.difficulty)) {
    ({ ids } = chooseIds((await candidateRows(sb, base)).filter(fits).map((r) => r.id), used, exclude, 1));
    if (ids.length) note = "It ignores the chapter/difficulty filters, because none matched.";
  }
  if (!ids.length) throw new QbError(409, "No other question with the same type and marks is available.");
  holder[key] = snapshot(must(await sb.from("qb_questions").select("*").eq("id", ids[0]).single()));
  must(await sb.from("qb_papers").update({ body: doc, qids: bodyQids(doc) }).eq("id", id));
  return { ok: true, note };
}
