// Live / Closed state of an online test.
//   • no settings row            → live (so nothing breaks before the switch is ever used)
//   • is_open = false            → closed by hand (beats the dates)
//   • opens_at in the future     → scheduled (not open yet)
//   • closes_at in the past      → ended (closed automatically)
//   • otherwise                  → live
export function stateOf(row, now = Date.now()) {
  if (!row) return { open: true, state: "live", opensAt: null, closesAt: null };
  const o = row.opens_at ? new Date(row.opens_at).getTime() : null;
  const c = row.closes_at ? new Date(row.closes_at).getTime() : null;
  let state = "live";
  if (row.is_open === false) state = "closed";
  else if (o && now < o) state = "scheduled";
  else if (c && now >= c) state = "ended";
  return { open: state === "live", state, opensAt: row.opens_at || null, closesAt: row.closes_at || null };
}

export async function testState(supabase, test) {
  const { data, error } = await supabase.from("online_test_settings").select("*").eq("test_slug", test).maybeSingle();
  if (error || !data) return stateOf(null);
  return stateOf(data);
}

export async function isTestOpen(supabase, test) {
  return (await testState(supabase, test)).open;
}

// every test that has a settings row → { slug: state }
export async function allStates(supabase) {
  const { data } = await supabase.from("online_test_settings").select("*");
  const out = {};
  (data || []).forEach((r) => { out[r.test_slug] = stateOf(r); });
  return out;
}
