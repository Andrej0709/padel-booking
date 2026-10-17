import { notFound } from "next/navigation";
import { Suspense } from "react";
import { trenutniKorisnik } from "@/lib/pristup";
import {
  cenaTermina,
  danasU,
  jeIspravanDatum,
  pomeriDatum,
  sadaUMinutima,
  slobodniTermini,
  TRAJANJA,
  ucitajKlubPoSlugu,
} from "@/lib/raspored";
import { lepTelefon } from "@/lib/format";
import { Znak } from "@/components/znak";
import { BiranjeTermina } from "./biranje-termina";

// Public page of one club: players pick a day, length and free time, then book (with an account).

const DANA_UNAPRED = 14;

export default function Page({ params, searchParams }: PageProps<"/k/[slug]">) {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Učitavam termine…</p>}>
      <Klub params={params} searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps<"/k/[slug]">) {
  const klub = await ucitajKlubPoSlugu((await params).slug);
  return { title: klub ? `${klub.naziv} · rezervacija` : "Klub" };
}

async function Klub({ params, searchParams }: PageProps<"/k/[slug]">) {
  const { slug } = await params;
  const klub = await ucitajKlubPoSlugu(slug);
  if (!klub) notFound();

  const danas = danasU(klub.vremenskaZona);
  const dani = Array.from({ length: DANA_UNAPRED }, (_, i) => pomeriDatum(danas, i));
  const { dan, trajanje: t } = await searchParams;
  const datum = typeof dan === "string" && jeIspravanDatum(dan) && dani.includes(dan) ? dan : danas;
  const trajanje = (TRAJANJA as readonly number[]).includes(Number(t)) ? Number(t) : 90;
  // Today only shows times that have not started yet.
  const odMinuta = datum === danas ? sadaUMinutima(klub.vremenskaZona) + 1 : 0;

  const [tereni, korisnik] = await Promise.all([
    slobodniTermini(klub, datum, trajanje, odMinuta),
    trenutniKorisnik(),
  ]);

  return (
    <div className="flex-1 bg-bg">
      <div className="bg-conf-bg text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-[18px] pb-6 pt-4 sm:px-6 lg:gap-6 lg:pb-9 lg:pt-6">
          <div className="flex items-center gap-2.5">
            <Znak velicina={34} tamniji />
            <div className="min-w-0 flex-1">
              <div className="font-naslov text-xl font-bold leading-none">{klub.naziv}</div>
              {klub.adresa && <div className="mt-1 truncate text-[13px] opacity-85">{klub.adresa}</div>}
            </div>
            {klub.telefon && (
              <a
                href={`tel:${klub.telefon}`}
                className="flex h-[42px] items-center rounded-[10px] bg-white/15 px-3.5 text-sm font-bold"
                aria-label={`Pozovi klub ${lepTelefon(klub.telefon)}`}
              >
                Pozovi<span className="hidden sm:inline">&nbsp;{lepTelefon(klub.telefon)}</span>
              </a>
            )}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="font-naslov text-[32px] font-bold leading-none lg:text-[44px]">Rezerviši teren</h1>
              <p className="mt-2 hidden text-[15px] opacity-85 sm:block">
                Izaberi dan, trajanje i slobodan termin. Plaćanje u klubu.
              </p>
            </div>
            <a
              href={korisnik ? "/moje-rezervacije" : `/prijava?nazad=/k/${klub.slug}`}
              className="text-sm font-bold underline-offset-2 hover:underline"
            >
              {korisnik ? "Moje rezervacije" : "Prijava"}
            </a>
          </div>
        </div>
      </div>

      <BiranjeTermina
        key={`${datum}-${trajanje}`}
        slug={klub.slug}
        dani={dani}
        datum={datum}
        trajanje={trajanje}
        tereni={tereni}
        cenaRsd={cenaTermina(klub, trajanje)}
        telefonKluba={klub.telefon}
        korisnik={korisnik ? { ime: korisnik.name, telefon: korisnik.telefon ? lepTelefon(korisnik.telefon) : "" } : null}
      />
    </div>
  );
}
