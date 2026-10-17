import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, CalendarPlus, Clock, MapPin } from "@phosphor-icons/react/ssr";
import { pool } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/pristup";
import { brojDana, danUNedelji, dinari, kratkiDatum, lepTelefon } from "@/lib/format";
import { kartica, naslov, natpis } from "@/components/ui";
import { DugmeOtkazi } from "./dugme-otkazi";
import { SATI_ZA_OTKAZIVANJE } from "@/lib/pravila";

export const metadata = { title: "Moji termini" };

type MojaRezervacija = {
  id: string;
  klub: string;
  slug: string;
  adresa: string | null;
  telefonKluba: string | null;
  datum: string;
  od: string;
  do: string;
  teren: string;
  status: "potvrdjena" | "odigrana" | "nedolazak" | "otkazana";
  cenaRsd: number | null;
  buduca: boolean;
  mozeOtkaz: boolean;
  minutaDo: number;
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-8">
          <div className="ucitava h-12 w-64 rounded-full" />
          <div className="ucitava h-56 rounded-[28px]" />
        </div>
      }
    >
      <Spisak />
    </Suspense>
  );
}

// "za 2 dana", "za 3 h", "za 40 min"
function koliko(minuta: number) {
  if (minuta >= 48 * 60) return `za ${Math.round(minuta / 1440)} dana`;
  if (minuta >= 24 * 60) return "sutra";
  if (minuta >= 60) return `za ${Math.round(minuta / 60)} h`;
  return `za ${Math.max(1, minuta)} min`;
}

async function Spisak() {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) redirect("/prijava?nazad=/moje-rezervacije");

  // Only bookings this account made online. Never the history of the phone number (decision 010).
  const { rows } = await pool.query<MojaRezervacija>(
    `select r.id, k.naziv as klub, k.slug, k.adresa, k.telefon as "telefonKluba",
            to_char(r.pocetak at time zone k.vremenska_zona, 'YYYY-MM-DD') as datum,
            to_char(r.pocetak at time zone k.vremenska_zona, 'HH24:MI') as od,
            to_char(r.kraj at time zone k.vremenska_zona, 'HH24:MI') as do,
            t.naziv as teren, r.status, r.cena_rsd as "cenaRsd",
            r.pocetak > now() as buduca,
            r.status = 'potvrdjena' and r.pocetak > now() + make_interval(hours => $2) as "mozeOtkaz",
            greatest(0, round(extract(epoch from r.pocetak - now()) / 60))::int as "minutaDo"
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
  const [sledeci, ...ostaliBuduci] = predstojece;
  const nazivStatusa = { potvrdjena: "Potvrđena", odigrana: "Odigrano", nedolazak: "Nije došao", otkazana: "Otkazano" };
  const bojaStatusa = {
    potvrdjena: "bg-hover text-brand",
    odigrana: "bg-played-bg text-played-fg",
    nedolazak: "bg-ns-bg text-ns-fg",
    otkazana: "bg-surface2 text-muted",
  };

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-4 py-8">
      <div className="ulaz flex flex-col gap-2">
        <span className={natpis}>Moji termini</span>
        <h1 className={`${naslov} text-[38px] leading-none sm:text-[46px]`}>
          {sledeci ? "Sledeći meč te čeka" : "Nemaš zakazan termin"}
        </h1>
      </div>

      {sledeci ? (
        <section className="ulaz nocno-nebo relative overflow-hidden rounded-[30px] p-6 sm:p-7" style={{ ["--i" as string]: 1 }}>
          <div className="flex items-start gap-5">
            <div className="flex h-[84px] w-[72px] flex-none flex-col items-center justify-center rounded-[22px] bg-white/10 ring-1 ring-white/15">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-lime">{danUNedelji(sledeci.datum)}</span>
              <span className="font-naslov text-[34px] font-bold leading-none">{brojDana(sledeci.datum)}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-lime px-2.5 py-0.5 text-xs font-bold text-lime-ink">
                <span className="puls h-1.5 w-1.5 rounded-full bg-lime-ink" />
                {koliko(sledeci.minutaDo)}
              </span>
              <strong className="font-naslov text-[30px] leading-none tracking-[-0.01em]">
                {sledeci.od}–{sledeci.do}
              </strong>
              <span className="text-night-ink/75">
                {sledeci.klub} · {sledeci.teren}
              </span>
              {sledeci.adresa && (
                <span className="flex items-center gap-1.5 text-sm text-night-ink/60">
                  <MapPin size={15} /> {sledeci.adresa}
                </span>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/kalendar/${sledeci.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[oklch(0.2_0.05_262)] transition-transform duration-300 ease-glatko active:scale-[0.97]"
            >
              <CalendarPlus size={18} weight="bold" /> Dodaj u kalendar
            </a>
            <span className="ml-auto text-sm font-semibold text-night-ink/70">{dinari(sledeci.cenaRsd)} · u klubu</span>
          </div>
          <div className="mt-4 rounded-[20px] bg-surface p-1 text-ink">
            <Otkazivanje r={sledeci} />
          </div>
        </section>
      ) : (
        <Link
          href="/"
          className={`${kartica} ulaz group flex items-center justify-between gap-4 p-6`}
          style={{ ["--i" as string]: 1 }}
        >
          <span>
            <strong className="block text-lg">Rezerviši teren</strong>
            <span className="text-muted">Slobodni termini za narednih 14 dana.</span>
          </span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-lime-ink transition-transform duration-300 ease-glatko group-hover:translate-x-1">
            <ArrowRight size={20} weight="bold" />
          </span>
        </Link>
      )}

      {ostaliBuduci.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[.1em] text-muted">Posle toga</h2>
          {ostaliBuduci.map((r, i) => (
            <div key={r.id} className={`${kartica} ulaz flex flex-col gap-3 p-5`} style={{ ["--i" as string]: i + 2 }}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl bg-surface2">
                  <span className="text-[10px] font-bold uppercase text-muted">{danUNedelji(r.datum)}</span>
                  <span className="font-naslov text-xl font-bold leading-none">{brojDana(r.datum)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-lg">
                    {r.od}–{r.do}
                  </strong>
                  <span className="text-sm text-muted">
                    <Link href={`/k/${r.slug}`} className="font-semibold text-ink">
                      {r.klub}
                    </Link>{" "}
                    · {r.teren} · {koliko(r.minutaDo)}
                  </span>
                </div>
                <a
                  href={`/api/kalendar/${r.id}`}
                  aria-label="Dodaj u kalendar"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface2 text-ink transition-colors hover:bg-hover hover:text-brand"
                >
                  <CalendarPlus size={19} />
                </a>
              </div>
              <Otkazivanje r={r} />
            </div>
          ))}
        </section>
      )}

      {ostale.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[.1em] text-muted">Ranije</h2>
          <div className={`${kartica} divide-y divide-line/70 overflow-hidden`}>
            {ostale.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                <strong className="min-w-[110px]">{kratkiDatum(r.datum)}</strong>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Clock size={15} className="text-muted" />
                  {r.od}–{r.do}
                </span>
                <span className="flex-1 truncate text-sm text-muted">
                  {r.klub} · {r.teren}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${bojaStatusa[r.status]}`}>{nazivStatusa[r.status]}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Otkazivanje({ r }: { r: MojaRezervacija }) {
  if (r.mozeOtkaz) return <DugmeOtkazi id={r.id} />;
  return (
    <p className="px-4 py-2 text-sm text-muted">
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
  );
}
