// A test with no settings row is OPEN, so nothing breaks before the
// Active/Closed switch has ever been used (or if its table is missing).
export async function isTestOpen(supabase, test) {
  const { data, error } = await supabase
    .from("online_test_settings").select("is_open").eq("test_slug", test).maybeSingle();
  if (error || !data) return true;
  return data.is_open !== false;
}
