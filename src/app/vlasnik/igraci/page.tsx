import Link from "next/link";
import { Suspense } from "react";
import { zahtevajClana } from "@/lib/pristup";
import { pretraziIgrace } from "@/lib/igraci";
import { kratkiDatum, lepTelefon } from "@/lib/format";
import { kartica, naslov, polje } from "@/components/ui";
import { VlasnikOkvir } from "../okvir";

export const metadata = { title: "Igrači" };

export default function Page({ searchParams }: PageProps<"/vlasnik/igraci">) {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Učitavam igrače…</p>}>
      <Igraci searchParams={searchParams} />
    </Suspense>
  );
}

async function Igraci({ searchParams }: Pick<PageProps<"/vlasnik/igraci">, "searchParams">) {
  const clan = await zahtevajClana("/vlasnik/igraci");
  const q = (await searchParams).q;
  const upit = typeof q === "string" ? q : "";
  const igraci = await pretraziIgrace(clan.klub.id, clan.klub.vremenskaZona, upit);

  return (
    <VlasnikOkvir clan={clan} aktivno="igraci">
      <main className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-5">
        <h1 className={`${naslov} text-[32px]`}>Igrači</h1>
        <p className="mt-1 text-[15px] text-muted">Svi koji su rezervisali, telefonom ili online. Jedan broj je jedan igrač.</p>

        {/* A plain GET form: the search lives in the address, so it survives a refresh. */}
        <form className="mt-5 flex gap-2" role="search">
          <input
            name="q"
            defaultValue={upit}
            placeholder="Ime ili broj telefona"
            aria-label="Pretraga igrača"
            className={polje}
          />
          <button className="h-12 flex-none rounded-xl bg-brand px-5 font-bold text-white">Traži</button>
        </form>

        <div className="mt-5 flex flex-col gap-2">
          {igraci.length === 0 && (
            <p className="text-[15px] text-muted">{upit ? "Nema igrača za tu pretragu." : "Još nema igrača."}</p>
          )}
          {igraci.map((i) => (
            <Link
              key={i.id}
              href={`/vlasnik/igraci/${i.id}`}
              className={`${kartica} flex flex-wrap items-center gap-x-4 gap-y-1 px-[18px] py-3.5 hover:bg-surface2`}
            >
              <span className="min-w-[140px] flex-1 text-base font-bold">{i.ime}</span>
              <span className="min-w-[120px] font-semibold text-muted">{lepTelefon(i.telefon)}</span>
              <span className="text-sm text-muted">
                {i.ukupno} rez. · poslednja {i.poslednji ? kratkiDatum(i.poslednji) : "—"}
              </span>
              {i.nedolasci > 0 && (
                <span className="rounded-md bg-ns-bg px-2 py-1 text-xs font-bold text-ns-fg">
                  Nije došao: {i.nedolasci}
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </VlasnikOkvir>
  );
}
