import { redirect } from "next/navigation";

// Legacy link support.
//
// /award-list was shared with teachers before exams existed, so it may be
// sitting in WhatsApp messages and bookmarks. It now points permanently at
// the September 2026 exam that all of that earlier data belongs to.
//
// It deliberately does NOT follow whichever exam is "current": an old link
// should never quietly start writing marks into a different exam. Each new
// exam gets its own link, shared fresh.
const LEGACY_EXAM_SLUG = "online-mcqs-sep-2026";

export default function AwardListRedirect() {
  redirect(`/award-list/${LEGACY_EXAM_SLUG}`);
}
