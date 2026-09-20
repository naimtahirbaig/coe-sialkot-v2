import { redirect } from "next/navigation";

// Result cards open with either the teachers' PIN or the admin password,
// so the page itself lives outside /admin. Keeping one implementation
// means the two entry points can never drift apart.
export default function AdminResultCardsRedirect() {
  redirect("/result-cards");
}
