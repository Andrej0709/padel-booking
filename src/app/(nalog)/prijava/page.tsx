import { Suspense } from "react";
import { googleUkljucen } from "@/lib/auth";
import { bezbedanPovratak } from "@/lib/povratak";
import { ObrazacPrijave } from "./obrazac";

export const metadata = { title: "Prijava" };

export default function Page({ searchParams }: PageProps<"/prijava">) {
  return (
    <Suspense>
      <Sadrzaj searchParams={searchParams} />
    </Suspense>
  );
}

async function Sadrzaj({ searchParams }: Pick<PageProps<"/prijava">, "searchParams">) {
  const { nazad, potvrdjeno } = await searchParams;
  return (
    <ObrazacPrijave
      povratak={bezbedanPovratak(nazad)}
      google={googleUkljucen}
      potvrdjeno={potvrdjeno === "1"}
    />
  );
}
