import { redirect } from "next/navigation";

// The schedule moved to /vlasnik when owner login was added.
export default function Page() {
  redirect("/vlasnik");
}
