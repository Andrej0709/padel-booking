import { Suspense } from "react";
import { zahtevajClana } from "@/lib/pristup";
import {
  cenaTermina,
  danasU,
  jeIspravanDatum,
  ucitajRezervacije,
  ucitajTerene,
} from "@/lib/raspored";
import { VlasnikOkvir } from "./okvir";
import { Tabla } from "./tabla";

export const metadata = { title: "Raspored" };

export default function Page({ searchParams }: PageProps<"/vlasnik">) {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Učitavam raspored…</p>}>
      <Raspored searchParams={searchParams} />
    </Suspense>
  );
}

async function Raspored({ searchParams }: Pick<PageProps<"/vlasnik">, "searchParams">) {
  const clan = await zahtevajClana("/vlasnik");
  const { klub } = clan;
  const danas = danasU(klub.vremenskaZona);
  const trazeni = (await searchParams).datum;
  const datum = typeof trazeni === "string" && jeIspravanDatum(trazeni) ? trazeni : danas;
  const [tereni, rezervacije] = await Promise.all([ucitajTerene(klub, datum), ucitajRezervacije(klub, datum)]);

  return (
    <VlasnikOkvir clan={clan} aktivno="raspored" punaVisina>
      <Tabla
        key={datum}
        datum={datum}
        danas={danas}
        vremenskaZona={klub.vremenskaZona}
        tereni={tereni}
        rezervacije={rezervacije}
        cenaPoTrajanju={{ 60: cenaTermina(klub, 60), 90: cenaTermina(klub, 90), 120: cenaTermina(klub, 120) }}
      />
    </VlasnikOkvir>
  );
}
