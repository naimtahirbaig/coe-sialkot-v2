import { redirect } from "next/navigation";

// The admin copy of the proformas is the same live view — keeping a second
// implementation would risk the two drifting apart. Admins sign in with the
// admin password option on that page.
export default function AdminProformasRedirect() {
  redirect("/proformas");
}
