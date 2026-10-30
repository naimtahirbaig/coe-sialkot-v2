// Looks up a student's EARLIER results in the same subject (and class), so a
// new result card can show a comparison. Sources, oldest first:
//   • submitted attempts in other tests of the same subject, and
//   • attempts archived in online_test_attempt_history by a retest
//     (including the earlier attempt of this very test).

const BUILTIN = {
  "oct-2026-class-8-geography-ch3": { subject: "Geography", classNum: 8, total: 52, short: "Geography Ch 3" },
};

export async function testMeta(supabase, slug) {
  if (BUILTIN[slug]) return BUILTIN[slug];
  const { data } = await supabase.from("online_test_defs")
    .select("subject, chapter, class_num, paper_size, month_label").eq("slug", slug).maybeSingle();
  if (!data) return null;
  return {
    subject: data.subject, classNum: data.class_num, total: data.paper_size,
    short: `${data.subject}${data.chapter ? " " + data.chapter : ""} (${data.month_label})`,
  };
}

export async function previousResults(supabase, studentId, slug, keep = 3) {
  try {
    const me = await testMeta(supabase, slug);
    if (!me) return [];
    const same = (s, c) => String(s).trim().toLowerCase() === me.subject.trim().toLowerCase() && Number(c) === Number(me.classNum);

    const metas = {};
    Object.entries(BUILTIN).forEach(([s, m]) => { if (same(m.subject, m.classNum)) metas[s] = m; });
    const { data: defs } = await supabase.from("online_test_defs")
      .select("slug, subject, chapter, class_num, paper_size, month_label").eq("class_num", me.classNum);
    (defs || []).forEach((d) => {
      if (same(d.subject, d.class_num)) {
        metas[d.slug] = { total: d.paper_size, short: `${d.subject}${d.chapter ? " " + d.chapter : ""} (${d.month_label})` };
      }
    });
    metas[slug] = metas[slug] || me;
    const slugs = Object.keys(metas);
    const label = (s, earlier) => `${metas[s].short}${earlier ? " — earlier attempt" : ""}`;

    const out = [];
    const { data: att } = await supabase.from("online_test_attempts")
      .select("test_slug, correct, percentage, grade, finished_at")
      .eq("student_id", String(studentId)).eq("status", "submitted").in("test_slug", slugs);
    (att || []).forEach((a) => out.push({
      short: label(a.test_slug, false), date: a.finished_at, correct: a.correct,
      total: metas[a.test_slug].total, pct: Number(a.percentage), grade: a.grade,
    }));

    const { data: hist } = await supabase.from("online_test_attempt_history")
      .select("data").eq("data->>student_id", String(studentId));
    (hist || []).forEach(({ data: d }) => {
      if (!d || d.status !== "submitted" || !metas[d.test_slug]) return;
      out.push({
        short: label(d.test_slug, d.test_slug === slug), date: d.finished_at, correct: d.correct,
        total: metas[d.test_slug].total, pct: Number(d.percentage), grade: d.grade,
      });
    });

    out.sort((x, y) => String(x.date).localeCompare(String(y.date)));
    return out.slice(-keep);
  } catch {
    return []; // never block a test because the comparison could not be built
  }
}
