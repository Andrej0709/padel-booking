import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Clock, Fire, MapPin, Medal, Timer, TennisBall } from "@phosphor-icons/react/ssr";
import { pool } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/pristup";
import { inicijali, lepTelefon, mnozina } from "@/lib/format";
import { kartica, natpis, oznaka, polje } from "@/components/ui";
import { Obrazac } from "@/components/obrazac";
import { Odjava } from "@/components/odjava";
import { PrekidacTeme } from "@/components/prekidac-teme";
import { sacuvajProfil } from "./actions";

export const metadata = { title: "Profil" };

type Statistika = {
  odigrano: number;
  minuta: number;
  nedolasci: number;
  klubova: number;
  omiljeniTeren: string | null;
  omiljeniSat: number | null;
  nedeljaZaRedom: number;
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-8">
          <div className="ucitava h-40 rounded-[28px]" />
          <div className="ucitava h-56 rounded-[28px]" />
        </div>
      }
    >
      <Profil />
    </Suspense>
  );
}

async function Profil() {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) redirect("/prijava?nazad=/profil");

  // Counted only from this account's own online bookings (decision 010).
  const { rows } = await pool.query<Statistika>(
    `with moje as (
       select r.*, t.naziv as teren, t.klub_id, k.vremenska_zona as zona
       from rezervacije r join tereni t on t.id = r.teren_id join klubovi k on k.id = t.klub_id
       where r.korisnik_id = $1 and r.status <> 'otkazana'
     ),
     odigrane as (select * from moje where status = 'odigrana' or (status = 'potvrdjena' and kraj < now()))
     select (select count(*)::int from odigrane) as odigrano,
            (select coalesce(sum(extract(epoch from kraj - pocetak) / 60), 0)::int from odigrane) as minuta,
            (select count(*)::int from moje where status = 'nedolazak') as nedolasci,
            (select count(distinct klub_id)::int from moje) as klubova,
            (select teren from odigrane group by teren order by count(*) desc limit 1) as "omiljeniTeren",
            (select extract(hour from pocetak at time zone zona)::int from odigrane
             group by 1 order by count(*) desc limit 1) as "omiljeniSat",
            -- How many weeks in a row (Monday to Sunday) had a played match, counting back from
            -- this week, or from last week if nothing is played yet this week.
            (with nedelje as (
               select distinct date_trunc('week', pocetak at time zone zona)::date as n from odigrane
             ),
             oznacene as (
               select n, row_number() over (order by n desc) as rb,
                      (select max(n) from nedelje) as poslednja
               from nedelje
             )
             select count(*)::int from oznacene
             where n = poslednja - ((rb - 1) * 7)::int
               and poslednja >= date_trunc('week', now() at time zone 'Europe/Belgrade')::date - 7
            ) as "nedeljaZaRedom"`,
    [korisnik.id],
  );
  const s = rows[0];
  const sati = Math.round((s.minuta / 60) * 10) / 10;

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 py-8">
      <section className="ulaz nocno-nebo relative flex flex-col gap-6 overflow-hidden rounded-[30px] p-6 sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full bg-lime font-naslov text-[28px] font-bold text-lime-ink ring-4 ring-white/10">
            {inicijali(korisnik.name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-naslov text-[32px] font-bold leading-none tracking-[-0.02em]">{korisnik.name}</h1>
            <p className="mt-1.5 truncate text-sm text-night-ink/70">{korisnik.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Broj vrednost={String(s.odigrano)} opis={mnozina(s.odigrano, "meč", "meča", "mečeva")} />
          <Broj vrednost={sati.toLocaleString("sr-RS")} opis="sati na terenu" />
          <Broj vrednost={String(s.nedeljaZaRedom)} opis={`${mnozina(s.nedeljaZaRedom, "nedelja", "nedelje", "nedelja")} zaredom`} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Cinjenica i={1} Ikona={MapPin} naziv="Omiljeni teren" vrednost={s.omiljeniTeren ?? "još nema"} />
        <Cinjenica i={2} Ikona={Clock} naziv="Najčešće igraš u" vrednost={s.omiljeniSat !== null ? `${String(s.omiljeniSat).padStart(2, "0")}:00` : "još nema"} />
        <Cinjenica i={3} Ikona={TennisBall} naziv="Klubovi" vrednost={String(s.klubova)} />
        <Cinjenica
          i={4}
          Ikona={s.nedolasci === 0 ? Medal : Timer}
          naziv="Nedolasci"
          vrednost={s.nedolasci === 0 ? "nijedan, bravo" : String(s.nedolasci)}
        />
      </section>

      {s.nedeljaZaRedom >= 2 && (
        <div className="ulaz flex items-center gap-3 rounded-[22px] bg-lime/25 px-5 py-4 text-sm font-semibold ring-1 ring-lime/50">
          <Fire size={22} weight="fill" className="text-[oklch(0.65_0.2_45)]" />
          Igraš {s.nedeljaZaRedom} nedelje zaredom. Nastavi niz i ove nedelje!
        </div>
      )}

      <section className={`${kartica} ulaz flex flex-col gap-4 p-5 sm:p-6`} style={{ ["--i" as string]: 5 }}>
        <div className="flex flex-col gap-2">
          <span className={natpis}>Moji podaci</span>
          <p className="text-sm text-muted">Ime i broj telefona se sami upisuju kad rezervišeš termin.</p>
        </div>
        <Obrazac akcija={sacuvajProfil} dugme="Sačuvaj">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={oznaka}>Ime i prezime</span>
              <input name="ime" defaultValue={korisnik.name} required autoComplete="name" className={polje} />
            </label>
            <label>
              <span className={oznaka}>Broj telefona</span>
              <input
                name="telefon"
                type="tel"
                inputMode="tel"
                defaultValue={korisnik.telefon ? lepTelefon(korisnik.telefon) : ""}
                placeholder="06x xxx xxxx"
                autoComplete="tel"
                className={polje}
              />
            </label>
          </div>
        </Obrazac>
      </section>

      <section className={`${kartica} ulaz flex flex-col gap-1 p-2`} style={{ ["--i" as string]: 6 }}>
        <PrekidacTeme />
        <Odjava kuda="/" siroko />
      </section>
    </main>
  );
}

function Broj({ vrednost, opis }: { vrednost: string; opis: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] bg-white/8 p-3.5 ring-1 ring-white/10">
      <span className="font-naslov text-[30px] font-bold leading-none [font-variant-numeric:normal]">{vrednost}</span>
      <span className="text-xs text-night-ink/65">{opis}</span>
    </div>
  );
}

function Cinjenica({
  i,
  Ikona,
  naziv,
  vrednost,
}: {
  i: number;
  Ikona: typeof Clock;
  naziv: string;
  vrednost: string;
}) {
  return (
    <div className={`${kartica} ulaz flex items-center gap-3.5 p-4`} style={{ ["--i" as string]: i }}>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-hover text-brand">
        <Ikona size={21} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-muted">{naziv}</span>
        <span className="block truncate text-[17px] font-bold">{vrednost}</span>
      </span>
    </div>
  );
}
