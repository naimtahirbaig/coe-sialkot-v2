// Every award-list route works against exactly one exam.
//
// Resolution order:
//   1. examSlug  — how the teacher pages address an exam
//                  (/award-list/online-mcqs-sep-2026)
//   2. examId    — how the admin screens address one
//   3. is_current — fallback, used by admin pages opened without a target
//
// Note the teacher entry pages ALWAYS pass a slug, so which exam a
// teacher writes into is fixed by the URL they were given. It never
// silently follows whatever is "current".

export async function resolveExam(supabase, examId, examSlug) {
  if (examSlug) {
    const { data, error } = await supabase
      .from("award_exams")
      .select("*")
      .eq("slug", examSlug)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "That exam link is not valid." };
    return { exam: data };
  }

  if (examId) {
    const { data, error } = await supabase
      .from("award_exams")
      .select("*")
      .eq("id", examId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Exam not found" };
    return { exam: data };
  }

  const { data, error } = await supabase
    .from("award_exams")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) {
    return {
      error:
        "No exam is currently open. An admin needs to set the current exam under Exams in the admin area.",
    };
  }
  return { exam: data };
}
