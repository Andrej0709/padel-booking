import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Znak } from "@/components/znak";
import { naslov } from "@/components/ui";
import { trenutniKorisnik } from "@/lib/pristup";
import { Odjava } from "../odjava";

export const metadata = { title: "Nema pristupa" };

export default function Page({ searchParams }: PageProps<"/vlasnik/bez-pristupa">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-[18px] bg-surface p-7 shadow-[0_0_0_1px_var(--line)]">
        <Znak velicina={40} />
        <Suspense>
          <Poruka searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Poruka({ searchParams }: Pick<PageProps<"/vlasnik/bez-pristupa">, "searchParams">) {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) redirect("/prijava?nazad=/vlasnik");
  const samoVlasnik = (await searchParams).samo === "vlasnik";

  return (
    <>
      <h1 className={`${naslov} text-[28px] leading-tight`}>
        {samoVlasnik ? "Ovo vidi samo vlasnik" : "Nalog nije u timu kluba"}
      </h1>
      <p className="text-[15px] leading-relaxed text-muted">
        {samoVlasnik ? (
          "Podešavanja kluba i tim može da menja samo vlasnik. Recepcija ima raspored i igrače."
        ) : (
          <>
            Prijavljen si kao <strong className="text-ink">{korisnik.email}</strong>, ali taj email nije dodat ni u
            jedan klub. Zamoli vlasnika kluba da te doda u tim, pa se prijavi ponovo.
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={samoVlasnik ? "/vlasnik" : "/"}
          className="flex h-11 items-center rounded-xl bg-brand px-4 text-[15px] font-bold text-white"
        >
          {samoVlasnik ? "Nazad na raspored" : "Na početnu"}
        </Link>
        <Odjava />
      </div>
    </>
  );
}
