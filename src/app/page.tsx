import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prviKlub } from "@/lib/raspored";

// No sales page yet: the home page opens the example club.
export default function Home() {
  return (
    <Suspense>
      <Preusmeri />
    </Suspense>
  );
}

async function Preusmeri() {
  const klub = await prviKlub();
  redirect(klub ? `/k/${klub.slug}` : "/prijava");
  return null;
}
