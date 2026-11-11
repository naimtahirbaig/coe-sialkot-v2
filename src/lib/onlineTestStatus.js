// Live / Closed state of an online test.
//   • no settings row            → CLOSED (a test is closed until the admin makes it live)
//   • is_open = false            → closed by hand (beats the dates)
//   • opens_at in the future     → scheduled (not open yet)
//   • closes_at in the past      → ended (closed automatically)
//   • otherwise                  → live
export function stateOf(row, now = Date.now()) {
  if (!row) return { open: false, state: "closed", opensAt: null, closesAt: null };
  const o = row.opens_at ? new Date(row.opens_at).getTime() : null;
  const c = row.closes_at ? new Date(row.closes_at).getTime() : null;
  let state = "live";
  if (row.is_open === false) state = "closed";
  else if (o && now < o) state = "scheduled";
  else if (c && now >= c) state = "ended";
  return { open: state === "live", state, opensAt: row.opens_at || null, closesAt: row.closes_at || null };
}

// Throws when the database cannot be read (so callers can say "try again" instead of "closed").
export async function testState(supabase, test) {
  const { data, error } = await supabase.from("online_test_settings").select("*").eq("test_slug", test).maybeSingle();
  if (error) throw new Error(error.message);
  return stateOf(data);
}

// Used when a student starts a test: if the database cannot be read, nobody can start anyway.
export async function isTestOpen(supabase, test) {
  try { return (await testState(supabase, test)).open; } catch { return false; }
}

// every test that has a settings row → { slug: state }   (throws if the database cannot be read)
export async function allStates(supabase) {
  const { data, error } = await supabase.from("online_test_settings").select("*");
  if (error) throw new Error(error.message);
  const out = {};
  (data || []).forEach((r) => { out[r.test_slug] = stateOf(r); });
  return out;
}
