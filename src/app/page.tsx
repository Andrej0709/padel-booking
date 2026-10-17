import { redirect } from "next/navigation";

// The owner's schedule is the only screen for now.
export default function Home() {
  redirect("/raspored");
}
