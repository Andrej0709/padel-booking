import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { pool } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/pristup";
import { dinari, kratkiDatum, lepTelefon } from "@/lib/format";
import { Znak } from "@/components/znak";
import { PrekidacTeme } from "@/components/prekidac-teme";
import { kartica, naslov } from "@/components/ui";
import { Odjava } from "../vlasnik/odjava";
import { DugmeOtkazi } from "./dugme-otkazi";
import { SATI_ZA_OTKAZIVANJE } from "@/lib/pravila";

export const metadata = { title: "Moje rezervacije" };

type MojaRezervacija = {
  id: string;
  klub: string;
  slug: string;
  telefonKluba: string | null;
  datum: string;
  od: string;
  do: string;
  teren: string;
  status: "potvrdjena" | "odigrana" | "nedolazak" | "otkazana";
  cenaRsd: number | null;
  buduca: boolean;
  mozeOtkaz: boolean;
};

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Znak velicina={32} />
          <span className="font-naslov text-lg font-bold">padel-booking</span>
        </Link>
        <div className="flex items-center gap-2">
          <PrekidacTeme mali />
          <Odjava kuda="/" />
        </div>
      </header>
      <Suspense fallback={<p className="p-6 text-muted">Učitavam…</p>}>
        <Spisak />
      </Suspense>
    </div>
  );
}

async function Spisak() {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) redirect("/prijava?nazad=/moje-rezervacije");

  // Only bookings this account made online. Never the history of the phone number (decision 010).
  const { rows } = await pool.query<MojaRezervacija>(
    `select r.id, k.naziv as klub, k.slug, k.telefon as "telefonKluba",
            to_char(r.pocetak at time zone k.vremenska_zona, 'YYYY-MM-DD') as datum,
            to_char(r.pocetak at time zone k.vremenska_zona, 'HH24:MI') as od,
            to_char(r.kraj at time zone k.vremenska_zona, 'HH24:MI') as do,
            t.naziv as teren, r.status, r.cena_rsd as "cenaRsd",
            r.pocetak > now() as buduca,
            r.status = 'potvrdjena' and r.pocetak > now() + make_interval(hours => $2) as "mozeOtkaz"
     from rezervacije r
     join tereni t on t.id = r.teren_id
     join klubovi k on k.id = t.klub_id
     where r.korisnik_id = $1
     order by r.pocetak desc
     limit 100`,
    [korisnik.id, SATI_ZA_OTKAZIVANJE],
  );
  const predstojece = rows.filter((r) => r.buduca && r.status === "potvrdjena").reverse();
  const ostale = rows.filter((r) => !(r.buduca && r.status === "potvrdjena"));
  const nazivStatusa = { potvrdjena: "Potvrđena", odigrana: "Odigrana", nedolazak: "Nije došao", otkazana: "Otkazana" };

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-6">
      <div>
        <h1 className={`${naslov} text-[32px]`}>Moje rezervacije</h1>
        <p className="mt-1 text-[15px] text-muted">
          {korisnik.name} · {korisnik.email}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-[13px] font-bold uppercase tracking-[.06em] text-muted">Predstojeće</h2>
        {predstojece.length === 0 && (
          <p className="text-[15px] text-muted">
            Nemaš zakazanih termina.{" "}
            <Link href="/" className="font-bold text-brand">
              Rezerviši teren
            </Link>
          </p>
        )}
        {predstojece.map((r) => (
          <div key={r.id} className={`${kartica} flex flex-col gap-3 p-4`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-lg">
                {kratkiDatum(r.datum)} · {r.od}–{r.do}
              </strong>
              <span className="font-semibold">{dinari(r.cenaRsd)}</span>
            </div>
            <div className="text-muted">
              <Link href={`/k/${r.slug}`} className="font-semibold text-ink">
                {r.klub}
              </Link>{" "}
              · {r.teren}
            </div>
            {r.mozeOtkaz ? (
              <DugmeOtkazi id={r.id} />
            ) : (
              <p className="text-sm text-muted">
                Manje od {SATI_ZA_OTKAZIVANJE} sati do početka. Za otkazivanje pozovi klub
                {r.telefonKluba && (
                  <>
                    :{" "}
                    <a href={`tel:${r.telefonKluba}`} className="font-bold text-brand">
                      {lepTelefon(r.telefonKluba)}
                    </a>
                  </>
                )}
                .
              </p>
            )}
          </div>
        ))}
      </section>

      {ostale.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-bold uppercase tracking-[.06em] text-muted">Ranije i otkazane</h2>
          {ostale.map((r) => (
            <div key={r.id} className={`${kartica} flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-xl px-4 py-3`}>
              <strong className="min-w-[110px]">{kratkiDatum(r.datum)}</strong>
              <span className="font-semibold">
                {r.od}–{r.do}
              </span>
              <span className="flex-1 text-muted">
                {r.klub} · {r.teren}
              </span>
              <span className="rounded-md bg-surface2 px-2 py-1 text-xs font-bold">{nazivStatusa[r.status]}</span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
