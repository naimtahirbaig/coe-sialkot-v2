"use client";
// Guided setup for an online test, one step at a time:
//   1 Sign in  →  2 Class  →  3 Subject & chapter  →  4 Test number (1st–5th)
//   →  5 Opens / closes dates  →  6 Go live  →  7 Share (link, picture, WhatsApp message)
import { useState, useEffect, useMemo, useCallback } from "react";

const NAVY = "#150F3F", GOLD = "#F3B129", GREEN = "#0B7A3E", RED = "#B3202A", AMBER = "#B7791F", INK = "#1c1b2e", MUTED = "#5b5a70", LINE = "#DCDAEA";
const ORD = ["", "1st", "2nd", "3rd", "4th", "5th"];
const ORD_UR = ["", "پہلا", "دوسرا", "تیسرا", "چوتھا", "پانچواں"];
const ordC = (n) => n + (n === 11 || n === 12 || n === 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));

const BUILTIN = {
  slug: "oct-2026-class-8-geography-ch3", base: "oct-2026-class-8-geography-ch3", round: 1, classNum: 8, subject: "Geography",
  chapter: "Chapter 3", month: "2026", perQ: 15, total: 52, url: "/online-tests-2026/class-8-geography-ch3.html", builtin: true,
};

const STEPS = ["Sign in", "Class", "Chapter", "Test number", "Dates", "Go live", "Share"];

const card = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: "0 2px 14px rgba(21,15,63,.07)" };
const inp = { padding: "12px 14px", fontSize: 16, border: "1.5px solid #9A9DB5", borderRadius: 10, background: "#fff", color: INK, width: "100%", boxSizing: "border-box" };
const bigBtn = (on = true, color = NAVY) => ({ padding: "14px 26px", fontSize: 16, fontWeight: 700, borderRadius: 12, border: `2px solid ${color}`, background: on ? color : "#fff", color: on ? "#fff" : color, cursor: "pointer" });
const ghost = { padding: "12px 20px", fontSize: 15, fontWeight: 600, borderRadius: 12, border: `1.5px solid ${NAVY}`, background: "#fff", color: NAVY, cursor: "pointer" };

const STATE = {
  live: ["LIVE", GREEN, "#E8F6EE"],
  scheduled: ["SCHEDULED", AMBER, "#FFF6DC"],
  closed: ["CLOSED", RED, "#FBEAEA"],
  ended: ["ENDED", RED, "#FBEAEA"],
};
const toLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const toIso = (v) => (v ? new Date(v).toISOString() : null);
const nice = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  let t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  if (t === "12:00 PM") t = "12:00 NOON";
  return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}, ${t}`;
};
function at(base, addDays, h, m) { const d = new Date(base); d.setDate(d.getDate() + addDays); d.setHours(h, m, 0, 0); return d; }

function Badge({ s }) {
  const b = STATE[s] || STATE.live;
  return <span style={{ background: b[2], color: b[1], border: `1.5px solid ${b[1]}`, borderRadius: 999, padding: "3px 12px", fontWeight: 800, fontSize: 12, letterSpacing: 0.5, whiteSpace: "nowrap" }}>● {b[0]}</span>;
}

export default function OnlineTestSetup() {
  const [step, setStep] = useState(1);
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [tests, setTests] = useState([]);        // every test, incl. the original Geography page
  const [loaded, setLoaded] = useState(false);
  const [cls, setCls] = useState(null);
  const [subj, setSubj] = useState("all");
  const [base, setBase] = useState(null);
  const [round, setRound] = useState(null);
  const [o, setO] = useState(""), [c, setC] = useState(""), [noDates, setNoDates] = useState(false);
  const [lang, setLang] = useState("en");
  const [fresh, setFresh] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/online-test/list", { cache: "no-store" }).then((r) => r.json());
      const all = (d.tests || []).map((t) => ({ slug: t.slug, base: t.base || t.slug, round: t.round || 1, classNum: t.classNum, subject: t.subject, chapter: t.chapter || "",
        month: t.month, perQ: t.perQ, total: t.total, url: t.url, state: t.state || (t.open ? "live" : "closed"), opensAt: t.opensAt, closesAt: t.closesAt }));
      let b = { ...BUILTIN, state: "live" };
      try { const s = await fetch(`/api/online-test/status?test=${BUILTIN.slug}`, { cache: "no-store" }).then((r) => r.json()); b = { ...b, state: s.state || (s.open === false ? "closed" : "live"), opensAt: s.opensAt, closesAt: s.closesAt }; } catch {}
      setTests([b, ...all]); setLoaded(true);
    } catch { setErr("Could not load the tests. Check your internet and refresh."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // remember the password for this browser tab only
  useEffect(() => {
    try { const p = sessionStorage.getItem("otsetup_pw"); if (p) { setPw(p); verify(p, true); } } catch {}
  }, []); // eslint-disable-line
  async function verify(p, silent) {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/online-test/verify", { method: "POST", headers: { "x-admin-password": p } });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "That password is not correct.");
      setAuthed(true); try { sessionStorage.setItem("otsetup_pw", p); } catch {}
      if (!silent) setStep(2); else setStep((s) => (s === 1 ? 2 : s));
    } catch (e) { if (!silent) setErr(e.message); try { sessionStorage.removeItem("otsetup_pw"); } catch {} }
    setBusy(false);
  }
  function signOut() { try { sessionStorage.removeItem("otsetup_pw"); } catch {} setAuthed(false); setPw(""); setStep(1); setCls(null); setBase(null); setRound(null); }

  const classes = useMemo(() => [...new Set(tests.map((t) => t.classNum))].sort((a, b) => a - b), [tests]);
  const inClass = useMemo(() => tests.filter((t) => t.classNum === cls), [tests, cls]);
  const subjects = useMemo(() => [...new Set(inClass.map((t) => t.subject))].sort(), [inClass]);
  const groups = useMemo(() => {
    const g = {}, order = [];
    inClass.forEach((t) => { if (!g[t.base]) { g[t.base] = { base: t.base, subject: t.subject, chapter: t.chapter, rounds: {} }; order.push(g[t.base]); } g[t.base].rounds[t.round] = t; });
    const num = (x) => (String(x.chapter).match(/\d+/) || [0])[0] * 1;
    return order.filter((x) => subj === "all" || x.subject === subj).sort((a, b) => String(a.subject).localeCompare(b.subject) || num(a) - num(b));
  }, [inClass, subj]);
  const group = useMemo(() => {
    if (!base) return null;
    const f = inClass.filter((t) => t.base === base);
    return f.length ? { base, subject: f[0].subject, chapter: f[0].chapter, rounds: Object.fromEntries(f.map((t) => [t.round, t])) } : null;
  }, [inClass, base]);
  const test = group && round ? group.rounds[round] : null;
  const title = test ? `Class ${test.classNum} · ${test.subject}${test.chapter ? " — " + test.chapter : ""} · ${ORD[test.round]} test` : "";

  // prefill dates whenever another test is chosen
  useEffect(() => { if (test) { setO(toLocal(test.opensAt)); setC(toLocal(test.closesAt)); setNoDates(false); } }, [test && test.slug]); // eslint-disable-line

  async function post(body) {
    const r = await fetch("/api/online-test/status", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": pw }, body: JSON.stringify({ tests: [test.slug], ...body }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Could not save");
    const s = await fetch(`/api/online-test/status?test=${encodeURIComponent(test.slug)}`, { cache: "no-store" }).then((x) => x.json());
    setTests((all) => all.map((t) => (t.slug === test.slug ? { ...t, state: s.state || (s.open ? "live" : "closed"), opensAt: s.opensAt, closesAt: s.closesAt } : t)));
    return s;
  }
  async function run(fn) { setBusy(true); setErr(""); try { await fn(); } catch (e) { setErr(e.message); } setBusy(false); }

  // ---- dates validation
  const dateProblem = (() => {
    if (noDates) return "";
    if (!o && !c) return "Set at least one date, or tick “No dates”.";
    if (o && c && new Date(c) <= new Date(o)) return "The deadline must be after the start time.";
    if (c && new Date(c) <= new Date()) return "The deadline is already in the past.";
    return "";
  })();

  // ---- share
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.coesialkot.com";
  const baseUrl = test ? origin + (test.builtin ? test.url : `/t/${test.slug}`) : "";
  const [vTok] = useState(() => Date.now().toString(36));
  const link = baseUrl + (fresh ? `?v=${vTok}` : "");
  const picture = test ? (test.builtin ? "/online-tests-2026/og-class-8-geography-ch3.png"
    : `/api/online-test/og?c=${test.classNum}&s=${encodeURIComponent(test.subject)}&ch=${encodeURIComponent(test.chapter)}&m=${encodeURIComponent(test.month)}&n=${test.total}&p=${test.perQ}&r=${test.round}`
      + (test.opensAt ? `&from=${encodeURIComponent(test.opensAt)}` : "") + (test.closesAt ? `&to=${encodeURIComponent(test.closesAt)}` : "")) : "";
  useEffect(() => {
    if (step !== 7 || !test) return;
    const nm = `${test.subject}${test.chapter ? " — " + test.chapter : ""}`;
    const en = `📢 *${nm}* (Class ${test.classNum})\n*${ORD[test.round]} Test* — ${test.total} MCQs, ${test.perQ} seconds each\n` +
      (test.opensAt ? `🟢 Starts: ${nice(test.opensAt)}\n` : "") + (test.closesAt ? `🔴 Deadline: ${nice(test.closesAt)}\n` : "") +
      `\nStart the test here:\n${link}\n\nCamera must be on. Each student can attempt only once.`;
    const ur = `📢 *${nm}* (جماعت ${test.classNum})\n*${ORD_UR[test.round]} ٹیسٹ* — ${test.total} سوالات، ہر سوال ${test.perQ} سیکنڈ\n` +
      (test.opensAt ? `🟢 آغاز: ${nice(test.opensAt)}\n` : "") + (test.closesAt ? `🔴 آخری تاریخ: ${nice(test.closesAt)}\n` : "") +
      `\nٹیسٹ شروع کرنے کے لیے لنک:\n${link}\n\nکیمرہ آن رکھنا ضروری ہے۔ ہر طالب علم صرف ایک بار ٹیسٹ دے سکتا ہے۔`;
    setMsgText(lang === "en" ? en : lang === "ur" ? ur : `${en}\n\n――――――――\n\n${ur}`);
  }, [step, test && test.slug, test && test.opensAt, test && test.closesAt, lang, link]); // eslint-disable-line
  async function copy(text, what) {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch {} t.remove();
    }
    setCopied(what); setTimeout(() => setCopied(""), 2200);
  }

  // ---- step gating
  const goto = (n) => { if (n < step || (n === 2 && authed) || (n > 1 && authed && n <= furthest())) { setErr(""); setStep(n); } };
  function furthest() { return !authed ? 1 : cls == null ? 2 : !group ? 3 : !test ? 4 : 7; }
  const summary = [cls != null ? `Class ${ordC(cls)}` : null, group ? `${group.subject}${group.chapter ? " — " + group.chapter : ""}` : null, test ? `${ORD[test.round]} test` : null].filter(Boolean);

  const H = ({ n, t, sub }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: GOLD, fontWeight: 800, fontSize: 12, letterSpacing: 2 }}>STEP {n} OF 7</div>
      <h1 style={{ margin: "4px 0 6px", fontSize: 28, color: NAVY, fontFamily: "Georgia, serif" }}>{t}</h1>
      <p style={{ margin: 0, color: MUTED, fontSize: 15 }}>{sub}</p>
    </div>
  );
  const Nav = ({ next, nextLabel, onNext, disabled, hideBack }) => (
    <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
      {!hideBack && step > 1 && <button type="button" style={ghost} onClick={() => { setErr(""); setStep(step - 1); }}>← Back</button>}
      <span style={{ flex: 1 }} />
      {next !== false && <button type="button" style={{ ...bigBtn(!(disabled || busy)), opacity: disabled || busy ? 0.45 : 1 }} disabled={disabled || busy} onClick={onNext || (() => { setErr(""); setStep(step + 1); })}>{busy ? "Please wait…" : nextLabel || "Continue →"}</button>}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", background: "#F3F2F9", zIndex: 40, colorScheme: "light", color: INK, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <header style={{ background: NAVY, color: "#fff", borderBottom: `5px solid ${GOLD}`, padding: "18px 16px 16px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: GOLD, fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>COE SIALKOT (BOYS)</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif" }}>Online Test Setup</div>
          </div>
          {authed && <><a href="/online-test-results" style={{ color: "#fff", fontSize: 13, textDecoration: "underline" }}>Results &amp; all tests</a>
            <button onClick={signOut} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.5)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Sign out</button></>}
        </div>
        <nav aria-label="Setup steps" style={{ maxWidth: 920, margin: "16px auto 0", display: "flex", gap: 4, overflowX: "auto" }}>
          {STEPS.map((s, i) => {
            const n = i + 1, done = n < step, cur = n === step, ok = n <= furthest();
            return (
              <button key={s} onClick={() => ok && goto(n)} disabled={!ok} aria-current={cur ? "step" : undefined}
                style={{ flex: 1, minWidth: 74, background: "transparent", border: "none", color: "#fff", cursor: ok ? "pointer" : "default", opacity: ok ? 1 : 0.45, padding: "4px 2px" }}>
                <div style={{ height: 5, borderRadius: 3, background: done ? "#2FB36D" : cur ? GOLD : "rgba(255,255,255,.25)", marginBottom: 6 }} />
                <div style={{ fontSize: 11.5, fontWeight: cur ? 800 : 500, whiteSpace: "nowrap" }}>{done ? "✓ " : `${n}. `}{s}</div>
              </button>
            );
          })}
        </nav>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "22px 16px 60px" }}>
        {summary.length > 0 && step > 1 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {summary.map((s) => <span key={s} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 600, color: NAVY }}>{s}</span>)}
          </div>
        )}
        <section style={{ ...card, padding: "28px 26px 24px" }}>
          {err && <div role="alert" style={{ background: "#FBEAEA", border: `1.5px solid ${RED}`, color: RED, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontWeight: 600, fontSize: 14 }}>{err}</div>}

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); if (pw) verify(pw); }}>
              <H n={1} t="Sign in" sub="Enter the admin password to set up an online test." />
              <label style={{ fontWeight: 600, fontSize: 14 }}>Admin password<br />
                <input type="password" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ ...inp, marginTop: 6, maxWidth: 420 }} placeholder="Password" />
              </label>
              <Nav hideBack nextLabel="Continue →" disabled={!pw} onNext={() => verify(pw)} />
            </form>
          )}

          {step === 2 && (
            <>
              <H n={2} t="Choose the class" sub="Which class is this test for?" />
              {!loaded ? <p>Loading tests…</p> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
                  {classes.map((k) => {
                    const ts = tests.filter((t) => t.classNum === k), live = ts.filter((t) => t.state === "live").length, sched = ts.filter((t) => t.state === "scheduled").length;
                    const on = cls === k;
                    return (
                      <button key={k} onClick={() => { setCls(k); setSubj("all"); setBase(null); setRound(null); }}
                        style={{ textAlign: "left", padding: "20px 18px", borderRadius: 14, cursor: "pointer", border: `2.5px solid ${on ? NAVY : LINE}`, background: on ? "#EEF0F9" : "#fff" }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, fontFamily: "Georgia, serif" }}>Class {ordC(k)}</div>
                        <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>{new Set(ts.map((t) => t.base)).size} chapter tests</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}><b style={{ color: GREEN }}>{live} live</b>{sched > 0 && <> · <b style={{ color: AMBER }}>{sched} scheduled</b></>}</div>
                      </button>
                    );
                  })}
                </div>
              )}
              <Nav disabled={cls == null} />
            </>
          )}

          {step === 3 && (
            <>
              <H n={3} t="Choose the subject and chapter" sub={`Class ${ordC(cls || 0)} — pick the chapter test you want to set up.`} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {["all", ...subjects].map((s) => (
                  <button key={s} onClick={() => setSubj(s)} style={{ padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `1.5px solid ${NAVY}`, background: subj === s ? NAVY : "#fff", color: subj === s ? "#fff" : NAVY }}>{s === "all" ? "All subjects" : s}</button>
                ))}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {groups.map((g) => {
                  const on = base === g.base, rs = Object.values(g.rounds);
                  return (
                    <button key={g.base} onClick={() => { setBase(g.base); setRound(null); }}
                      style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: `2.5px solid ${on ? NAVY : LINE}`, background: on ? "#EEF0F9" : "#fff" }}>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: "block", fontWeight: 800, color: NAVY, fontSize: 16 }}>{g.subject}</span>
                        <span style={{ fontSize: 14, color: INK }}>{g.chapter || "Full subject test"}</span>
                      </span>
                      <span style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((r) => { const t = g.rounds[r]; const col = !t ? "#ddd" : t.state === "live" ? GREEN : t.state === "scheduled" ? AMBER : RED; return <i key={r} title={t ? `${ORD[r]} test: ${t.state}` : `${ORD[r]} test not added`} style={{ width: 12, height: 12, borderRadius: 6, background: col, display: "block" }} />; })}
                      </span>
                      <span style={{ fontSize: 12, color: MUTED, minWidth: 54, textAlign: "right" }}>{rs.length} test{rs.length > 1 ? "s" : ""}</span>
                    </button>
                  );
                })}
                {loaded && groups.length === 0 && <p style={{ color: MUTED }}>No tests for this class yet.</p>}
              </div>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>The five dots show the 1st to 5th test: <b style={{ color: GREEN }}>green</b> live, <b style={{ color: AMBER }}>amber</b> scheduled, <b style={{ color: RED }}>red</b> closed, grey not added.</p>
              <Nav disabled={!group} />
            </>
          )}

          {step === 4 && group && (
            <>
              <H n={4} t="Choose the test number" sub={`${group.subject}${group.chapter ? " — " + group.chapter : ""}. Each test number has its own link, dates and results.`} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
                {[1, 2, 3, 4, 5].map((r) => {
                  const t = group.rounds[r], on = round === r;
                  return (
                    <button key={r} disabled={!t} onClick={() => setRound(r)}
                      style={{ padding: "18px 12px", borderRadius: 14, textAlign: "center", cursor: t ? "pointer" : "not-allowed", opacity: t ? 1 : 0.5, border: `2.5px solid ${on ? NAVY : LINE}`, background: on ? "#EEF0F9" : "#fff" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, fontFamily: "Georgia, serif" }}>{ORD[r]}</div>
                      <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>test</div>
                      {t ? <Badge s={t.state} /> : <span style={{ fontSize: 12, color: MUTED }}>not added yet</span>}
                      {t && t.state === "scheduled" && t.opensAt && <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>opens {new Date(t.opensAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>}
                    </button>
                  );
                })}
              </div>
              {[2, 3, 4, 5].some((r) => !group.rounds[r]) && <p style={{ fontSize: 12.5, color: MUTED, marginTop: 12 }}>“Not added yet”: run <code>node scripts/add-rounds.mjs</code> once to add the 2nd–5th tests.</p>}
              <Nav disabled={!test} />
            </>
          )}

          {step === 5 && test && (
            <>
              <H n={5} t="Set the start and closing time" sub={title} />
              <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "0 0 16px", fontSize: 15 }}>
                <input type="checkbox" checked={noDates} onChange={(e) => setNoDates(e.target.checked)} style={{ width: 18, height: 18 }} />
                <span><b>No dates</b> — no start or closing time; I will open and close it myself</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, opacity: noDates ? 0.4 : 1, pointerEvents: noDates ? "none" : "auto" }}>
                <div>
                  <div style={{ fontWeight: 800, color: GREEN, letterSpacing: 1, fontSize: 13, marginBottom: 6 }}>🟢 TEST STARTS</div>
                  <input type="datetime-local" value={o} onChange={(e) => setO(e.target.value)} style={inp} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {[["Now", () => new Date(Date.now() + 60000)], ["Tomorrow 8 AM", () => at(Date.now(), 1, 8, 0)], ["Next Monday 8 AM", () => { const d = new Date(); return at(d, ((8 - d.getDay()) % 7) || 7, 8, 0); }]].map(([l, f]) => (
                      <button key={l} type="button" onClick={() => setO(toLocal(f()))} style={{ ...ghost, padding: "6px 12px", fontSize: 12.5 }}>{l}</button>
                    ))}
                    <button type="button" onClick={() => setO("")} style={{ ...ghost, padding: "6px 12px", fontSize: 12.5, color: MUTED, borderColor: LINE }}>Clear</button>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: AMBER, letterSpacing: 1, fontSize: 13, marginBottom: 6 }}>🔴 DEADLINE (CLOSES)</div>
                  <input type="datetime-local" value={c} onChange={(e) => setC(e.target.value)} style={inp} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {[["Sunday 12 NOON", () => { const d = new Date(o || Date.now()); return at(d, (7 - d.getDay()) % 7, 12, 0); }], ["1 day after start", () => at(o || Date.now(), 1, new Date(o || Date.now()).getHours(), new Date(o || Date.now()).getMinutes())], ["3 days after", () => at(o || Date.now(), 3, 12, 0)], ["7 days after", () => at(o || Date.now(), 7, 12, 0)]].map(([l, f]) => (
                      <button key={l} type="button" onClick={() => setC(toLocal(f()))} style={{ ...ghost, padding: "6px 12px", fontSize: 12.5 }}>{l}</button>
                    ))}
                    <button type="button" onClick={() => setC("")} style={{ ...ghost, padding: "6px 12px", fontSize: 12.5, color: MUTED, borderColor: LINE }}>Clear</button>
                  </div>
                </div>
              </div>
              {!noDates && (o || c) && !dateProblem && (
                <div style={{ marginTop: 18, background: "#F4F6F9", borderRadius: 12, padding: "12px 16px", fontSize: 14 }}>
                  {o && <div>🟢 Starts <b>{nice(toIso(o))}</b></div>}{c && <div>🔴 Closes <b>{nice(toIso(c))}</b></div>}
                </div>
              )}
              {dateProblem && <p style={{ color: RED, fontWeight: 600, fontSize: 14, marginTop: 14 }}>{dateProblem}</p>}
              <p style={{ fontSize: 12.5, color: MUTED, marginTop: 12 }}>Times use this computer’s clock. The start time and deadline are printed on the WhatsApp share picture.</p>
              <Nav disabled={!!dateProblem} nextLabel="Save dates & continue →"
                onNext={() => run(async () => { await post({ opensAt: noDates ? null : toIso(o), closesAt: noDates ? null : toIso(c) }); setStep(6); })} />
            </>
          )}

          {step === 6 && test && (() => {
            const s = test.state, future = test.opensAt && new Date(test.opensAt) > new Date();
            return (
              <>
                <H n={6} t="Go live" sub={title} />
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: "#F4F6F9", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 13, color: MUTED }}>Current status</div>
                    <div style={{ marginTop: 6 }}><Badge s={s} /></div>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                    <div>🟢 Starts: <b>{test.opensAt ? nice(test.opensAt) : "as soon as it is live"}</b></div>
                    <div>🔴 Closes: <b>{test.closesAt ? nice(test.closesAt) : "when you close it"}</b></div>
                  </div>
                </div>
                {s === "live" || s === "scheduled" ? (
                  <div style={{ background: "#E8F6EE", border: `1.5px solid ${GREEN}`, borderRadius: 12, padding: "14px 16px", color: "#064d27", fontWeight: 600 }}>
                    {s === "live" ? "✓ This test is live. Students can start it now." : `✓ This test is scheduled. It opens automatically on ${nice(test.opensAt)}.`}
                  </div>
                ) : (
                  <div style={{ background: "#FBEAEA", border: `1.5px solid ${RED}`, borderRadius: 12, padding: "14px 16px", color: RED, fontWeight: 600 }}>
                    This test is closed. Students cannot start it until you make it live.
                  </div>
                )}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
                  {(s === "closed" || s === "ended") && (
                    <button style={bigBtn(true, GREEN)} disabled={busy} onClick={() => run(async () => { await post(future ? { open: true } : { goLive: true }); })}>
                      {future ? `Activate — opens ${nice(test.opensAt)}` : "Make live now"}
                    </button>
                  )}
                  {s === "scheduled" && <button style={bigBtn(false, GREEN)} disabled={busy} onClick={() => run(async () => { await post({ goLive: true }); })}>Open it right now instead</button>}
                  {s !== "closed" && s !== "ended" && <button style={{ ...ghost, color: RED, borderColor: RED }} disabled={busy}
                    onClick={() => { if (window.confirm("Close this test? Students who have not started can no longer begin. Anyone already taking it can finish.")) run(async () => { await post({ open: false }); }); }}>Close test</button>}
                  <button style={ghost} onClick={() => setStep(5)}>Change dates</button>
                </div>
                <p style={{ fontSize: 12.5, color: MUTED, marginTop: 14 }}>You can close a live test at any time. A student who has already started can always finish.</p>
                <Nav nextLabel="Continue to share →" disabled={s === "closed" || s === "ended"} />
                {(s === "closed" || s === "ended") && <p style={{ textAlign: "right", fontSize: 12.5, color: MUTED, margin: "6px 0 0" }}>Make the test live (or activate it) to continue.</p>}
              </>
            );
          })()}

          {step === 7 && test && (
            <>
              <H n={7} t="Share the test" sub={title} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}><Badge s={test.state} />
                {test.opensAt && <span style={{ fontSize: 13 }}>🟢 {nice(test.opensAt)}</span>}{test.closesAt && <span style={{ fontSize: 13 }}>🔴 {nice(test.closesAt)}</span>}</div>

              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1, color: NAVY, marginBottom: 6 }}>STUDENT LINK</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input readOnly value={link} onFocus={(e) => e.target.select()} style={{ ...inp, flex: 1, minWidth: 240, fontSize: 14 }} />
                <button style={bigBtn(true, copied === "link" ? GREEN : NAVY)} onClick={() => copy(link, "link")}>{copied === "link" ? "✓ Copied" : "Copy link"}</button>
                <a href={link} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Open ↗</a>
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: MUTED, marginTop: 8 }}>
                <input type="checkbox" checked={fresh} onChange={(e) => setFresh(e.target.checked)} />
                Add a fresh-preview mark to the link (use if WhatsApp still shows an old picture for this link)
              </label>

              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1, color: NAVY, margin: "22px 0 6px" }}>WHAT WHATSAPP WILL SHOW</div>
              <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", maxWidth: 560 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={picture} alt="Share picture" style={{ display: "block", width: "100%", background: "#241C63" }} />
                <div style={{ padding: "10px 14px", background: "#F4F6F9", fontSize: 13 }}><b>{test.subject}{test.chapter ? " — " + test.chapter : ""} — Class {test.classNum} MCQs Online Test — {ORD[test.round]} Test</b><div style={{ color: MUTED }}>coesialkot.com</div></div>
              </div>

              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1, color: NAVY, margin: "22px 0 6px" }}>MESSAGE FOR THE WHATSAPP GROUP</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[["en", "English"], ["ur", "اردو"], ["both", "Both"]].map(([k, l]) => (
                  <button key={k} onClick={() => setLang(k)} style={{ padding: "6px 16px", borderRadius: 999, border: `1.5px solid ${NAVY}`, background: lang === k ? NAVY : "#fff", color: lang === k ? "#fff" : NAVY, fontWeight: 700, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
              <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)} rows={lang === "both" ? 16 : 8} dir={lang === "ur" ? "rtl" : "auto"} style={{ ...inp, fontSize: 14.5, lineHeight: 1.7, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <button style={bigBtn(true, copied === "msg" ? GREEN : NAVY)} onClick={() => copy(msgText, "msg")}>{copied === "msg" ? "✓ Message copied" : "Copy message"}</button>
                <a href={`https://wa.me/?text=${encodeURIComponent(msgText)}`} target="_blank" rel="noreferrer" style={{ ...bigBtn(true, "#128C7E"), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Send on WhatsApp</a>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30, paddingTop: 18, borderTop: `1px solid ${LINE}` }}>
                <a href={`/online-test-results?test=${encodeURIComponent(test.slug)}`} style={{ ...ghost, textDecoration: "none" }}>Result cards for this test</a>
                <button style={ghost} onClick={() => { setRound(null); setStep(4); load(); }}>Set up another test number</button>
                <button style={ghost} onClick={() => { setBase(null); setRound(null); setStep(3); load(); }}>Set up another chapter</button>
                <button style={ghost} onClick={() => { setCls(null); setBase(null); setRound(null); setStep(2); load(); }}>Start over</button>
              </div>
            </>
          )}
        </section>
        <p style={{ textAlign: "center", color: MUTED, fontSize: 12, marginTop: 16 }}>Centre of Excellence Sialkot (Boys) · Online Test Setup</p>
      </main>
    </div>
  );
}
