// Supabase returns at most 1,000 rows per request. Past that it silently
// truncates — no error, just fewer rows than exist.
//
// With 1,420 students and several thousand marks, any whole-school query
// hits that ceiling, and whole sections quietly go missing from the
// results. This pages through in chunks until everything is read.
//
// `build` must return a FRESH query each call (a builder can only be
// executed once). Always order by a unique column so pages never overlap
// or skip rows.
//
//   const rows = await fetchAll(() =>
//     supabase.from("award_students").select("id, section_id").order("id")
//   );

export async function fetchAll(build, pageSize = 1000) {
  const out = [];
  let from = 0;
  for (;;) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}
