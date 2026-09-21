// Read every row of a query, however many there are — and PROVE it.
//
// Supabase caps a single request (1,000 rows by default, and a project
// admin can lower it). Past the cap it silently truncates: no error, just
// fewer rows than exist. That once made whole sections, and later all the
// newly saved marks, vanish from the proformas.
//
// This guards against that permanently, two ways:
//
//   1. It asks the database for the EXACT row count on the first request,
//      then keeps paging until it has that many rows. It never assumes a
//      page size, so it still works if the server cap changes.
//
//   2. If it ends up with a different number of rows than the database
//      said exist, it THROWS rather than returning partial data. A report
//      showing an error is recoverable; a report quietly showing wrong
//      figures on an official proforma is not.
//
// Usage — `build` receives options to pass straight into .select():
//
//   const rows = await fetchAll((opts) =>
//     supabase
//       .from("award_marks")
//       .select("student_id, subject_name, marks_obtained", opts)
//       .eq("exam_id", examId)
//       .order("id", { ascending: true })
//   );
//
// Always order by a unique column (id) so pages never overlap or skip.

export async function fetchAll(build, pageSize = 1000) {
  const out = [];
  let from = 0;
  let expected = null;
  let first = true;

  for (let guard = 0; guard < 10000; guard++) {
    const { data, error, count } = await build(first ? { count: "exact" } : undefined)
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (first) {
      expected = typeof count === "number" ? count : null;
      first = false;
    }
    if (!data || data.length === 0) break;

    out.push(...data);
    from += data.length;          // advance by what actually arrived

    if (expected !== null) {
      if (out.length >= expected) break;
    } else if (data.length < pageSize) {
      break;
    }
  }

  if (expected !== null && out.length !== expected) {
    throw new Error(
      `Incomplete read: the database has ${expected} rows but only ${out.length} ` +
      `were received. Refusing to show partial results — please refresh.`
    );
  }
  return out;
}
