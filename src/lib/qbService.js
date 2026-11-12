// Question Bank: everything that talks to the database. `sb` is a Supabase client, passed in
// so the same code can be tested against a fake one.
import bcrypt from "bcryptjs";
import { fetchAll } from "@/lib/fetchAll";
import {
  QTYPES, QTYPE_PLURAL, DIFFICULTIES, PER_PAGE, MAX_IMPORT_ROWS, QbError, letter,
  parseQuestion, parseImportRow, parsePaperSpec, chooseIds, signToken, verifyToken, safeEqual,
} from "@/lib/questionBank";

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

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
const toRow = (q) => ({ ...q, classNum: q.class_num });

export async function listQuestions(sb, user, a) {
  const page = Math.max(1, parseInt(a.get("page"), 10) || 1);
  let q = sb.from("qb_questions").select("*", { count: "exact" });
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
    rows: (data || []).map((r) => ({ ...toRow(r), canEdit: user.role === "admin" || r.created_by === user.id })),
  };
}

export async function createQuestion(sb, user, body) {
  const { errors, data } = parseQuestion(body);
  if (errors.length) throw new QbError(400, errors.join(" "));
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

// ------------------------------------------------------------ paper helpers
async function candidateIds(sb, f) {
  const rows = await fetchAll((o) => {
    let q = sb.from("qb_questions").select("id", o).eq("class_num", f.classNum).eq("subject", f.subject)
      .eq("qtype", f.qtype).eq("marks", f.marks);
    if (f.chapters?.length) q = q.in("chapter", f.chapters);
    if (DIFFICULTIES.includes(f.difficulty)) q = q.eq("difficulty", f.difficulty);
    return q.order("id");
  });
  return rows.map((r) => r.id);
}

async function usedBefore(sb, classNum, subject) {
  const rows = must(await sb.from("qb_papers").select("qids").eq("class_num", classNum).eq("subject", subject));
  return new Set(rows.flatMap((r) => r.qids || []));
}

const snapshot = (q) => ({
  qid: q.id, qtype: q.qtype, chapter: q.chapter, text: q.text, opts: q.opts || [], correct: q.correct,
  answer: q.answer, marks: Number(q.marks),
});

export async function availability(sb, a) {
  const classNum = Number(a.get("classNum")), marks = Number(a.get("marks"));
  const subject = a.get("subject") || "", qtype = a.get("qtype") || "";
  if (!classNum || !subject || !QTYPES[qtype] || !(marks > 0)) return { available: null };
  const ids = await candidateIds(sb, { classNum, subject, qtype, marks, chapters: a.getAll("chapters"), difficulty: a.get("difficulty") || "" });
  return { available: ids.length };
}

export async function generatePaper(sb, user, body) {
  const { errors, form, specs } = parsePaperSpec(body);
  const fail = (list) => { throw new QbError(400, list.join(" ")); };
  if (errors.length) fail(errors);

  const used = await usedBefore(sb, form.classNum, form.subject);
  const taken = new Set();
  const picks = [];
  const shortage = [];
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const cands = await candidateIds(sb, { classNum: form.classNum, subject: form.subject, qtype: s.qtype, marks: s.marks, chapters: form.chapters, difficulty: form.difficulty });
    const { ids } = chooseIds(cands, used, taken, s.count);
    if (ids.length < s.count) {
      shortage.push(`Section ${letter(i)} (${QTYPE_PLURAL[s.qtype]}, ${s.marks} marks each): need ${s.count} but only ${ids.length} available. Ask teachers to add more, or relax the filters.`);
    }
    ids.forEach((id) => taken.add(id));
    picks.push(ids);
  }
  if (shortage.length) fail(shortage);

  const all = [...taken];
  const rows = {};
  for (const part of chunk(all, 200)) must(await sb.from("qb_questions").select("*").in("id", part)).forEach((r) => { rows[r.id] = r; });

  const sections = specs.map((s, i) => ({
    title: `Section ${letter(i)}: ${QTYPE_PLURAL[s.qtype]}`,
    instructions: s.instr || (s.attempt === s.count ? "Attempt all questions." : `Attempt any ${s.attempt} questions.`),
    qtype: s.qtype, count: s.count, attempt: s.attempt, marksEach: s.marks,
    questions: picks[i].map((id) => snapshot(rows[id])),
  }));
  const created = must(await sb.from("qb_papers").insert({
    title: form.title, school: form.school, class_num: form.classNum, subject: form.subject,
    total_marks: form.totalMarks, duration_min: form.duration, instructions: form.instructions,
    filters: { chapters: form.chapters, difficulty: form.difficulty }, sections, qids: all,
  }).select("id").single());
  return { id: created.id };
}

const paperOut = (p) => ({
  id: p.id, title: p.title, school: p.school, classNum: p.class_num, subject: p.subject,
  totalMarks: Number(p.total_marks), duration: p.duration_min, instructions: p.instructions,
  createdAt: p.created_at, filters: p.filters, sections: p.sections,
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

export async function swapQuestion(sb, id, si, qi) {
  const p = await getPaperRow(sb, id);
  const sec = p.sections?.[si];
  const cur = sec?.questions?.[qi];
  if (!cur) throw new QbError(404, "Question not found in this paper.");
  const exclude = new Set(p.sections.flatMap((s) => s.questions.map((q) => q.qid)));
  const f = p.filters || {};
  const base = { classNum: p.class_num, subject: p.subject, qtype: sec.qtype, marks: sec.marksEach };
  const used = await usedBefore(sb, p.class_num, p.subject);
  let note = "";
  let { ids } = chooseIds(await candidateIds(sb, { ...base, chapters: f.chapters, difficulty: f.difficulty }), used, exclude, 1);
  if (!ids.length && (f.chapters?.length || f.difficulty)) {
    ({ ids } = chooseIds(await candidateIds(sb, base), used, exclude, 1));
    if (ids.length) note = "It ignores the chapter/difficulty filters, because none matched.";
  }
  if (!ids.length) throw new QbError(409, "No other question with the same type and marks is available.");
  const next = must(await sb.from("qb_questions").select("*").eq("id", ids[0]).single());
  const sections = p.sections.map((s, i) => (i !== si ? s : { ...s, questions: s.questions.map((q, j) => (j === qi ? snapshot(next) : q)) }));
  const qids = sections.flatMap((s) => s.questions.map((q) => q.qid));
  must(await sb.from("qb_papers").update({ sections, qids }).eq("id", id));
  return { ok: true, note };
}
