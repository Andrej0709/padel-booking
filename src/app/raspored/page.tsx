import { Suspense } from "react";
import Link from "next/link";
import {
  danasU,
  jeIspravanDatum,
  pomeriDatum,
  ucitajKlub,
  ucitajRaspored,
} from "@/lib/raspored";
import { Tabla } from "./tabla";
import { BiracDatuma } from "./birac-datuma";

export const metadata = { title: "Raspored terena" };

export default function Page({ searchParams }: PageProps<"/raspored">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-zinc-500">Učitavam raspored…</p>}>
        <Raspored searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Raspored({ searchParams }: Pick<PageProps<"/raspored">, "searchParams">) {
  const klub = await ucitajKlub();
  if (!klub) {
    return <p>Nema nijednog kluba u bazi. Pokreni <code>npm run db:seed</code>.</p>;
  }

  const danas = danasU(klub.vremenskaZona);
  const trazeni = (await searchParams).datum;
  const datum = typeof trazeni === "string" && jeIspravanDatum(trazeni) ? trazeni : danas;
  const { tereni, rezervacije } = await ucitajRaspored(klub, datum);

  const naslov = new Intl.DateTimeFormat("sr-Latn-RS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${datum}T12:00:00Z`));

  const dugme =
    "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

  return (
    <>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">{klub.naziv}</p>
          <h1 className="text-2xl font-semibold first-letter:uppercase">{naslov}</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link className={dugme} href={`/raspored?datum=${pomeriDatum(datum, -1)}`}>
            ← Prethodni
          </Link>
          {datum !== danas && (
            <Link className={dugme} href="/raspored">
              Danas
            </Link>
          )}
          <Link className={dugme} href={`/raspored?datum=${pomeriDatum(datum, 1)}`}>
            Sledeći →
          </Link>
          <BiracDatuma datum={datum} />
        </nav>
      </header>

      <Tabla
        key={datum}
        datum={datum}
        jeDanas={datum === danas}
        vremenskaZona={klub.vremenskaZona}
        tereni={tereni}
        rezervacije={rezervacije}
      />
    </>
  );
}
