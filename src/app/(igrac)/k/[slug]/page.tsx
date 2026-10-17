import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowDown, Clock, CloudSun, House, MapPin, Phone, Tag } from "@phosphor-icons/react/ssr";
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
  ucitajTerene,
} from "@/lib/raspored";
import { dinari, lepTelefon, mnozina, uVreme } from "@/lib/format";
import { jePogodnost, POGODNOSTI } from "@/lib/pogodnosti";
import { TerenCrtez } from "@/components/teren-crtez";
import { PogodnostIkona } from "@/components/pogodnost-ikona";
import { kartica, naslov, natpis } from "@/components/ui";
import { BiranjeTermina } from "./biranje-termina";

// Public page of one club (decision 013): a hero with the club, what it offers,
// then booking in three steps (day and length, time, confirm). Booking needs an account (decision 010).

const DANA_UNAPRED = 14;

export default function Page({ params, searchParams }: PageProps<"/k/[slug]">) {
  return (
    <Suspense fallback={<Kostur />}>
      <Klub params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function Kostur() {
  return (
    <div className="-mt-[68px] flex flex-col gap-6">
      <div className="nocno-nebo h-[460px] rounded-b-[36px]" />
      <div className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 sm:px-6 lg:grid-cols-3">
        <div className="ucitava h-48 rounded-[22px] lg:col-span-2" />
        <div className="ucitava h-48 rounded-[22px]" />
      </div>
    </div>
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

  const [tereni, tereniDanas, korisnik] = await Promise.all([
    slobodniTermini(klub, datum, trajanje, odMinuta),
    ucitajTerene(klub, danas),
    trenutniKorisnik(),
  ]);

  const intervali = tereniDanas.flatMap((x) => x.intervali);
  const otvara = intervali.length ? Math.min(...intervali.map((i) => i.od)) : null;
  const zatvara = intervali.length ? Math.max(...intervali.map((i) => i.do)) : null;
  const slobodnih = tereni.reduce((n, x) => n + x.termini.filter((s) => s.slobodan).length, 0);
  const zatvorenih = tereniDanas.filter((x) => x.vrsta === "zatvoren").length;
  const pogodnosti = klub.pogodnosti.filter(jePogodnost);
  const mapa = klub.adresa ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(klub.adresa)}` : null;

  return (
    <div className="-mt-[68px] flex flex-1 flex-col">
      <section className="nocno-nebo relative overflow-hidden rounded-b-[36px] pb-10 pt-[100px] sm:pb-14 lg:pt-[120px]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-5">
            <span className="ulaz inline-flex w-max items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lime ring-1 ring-white/10">
              <span className="puls h-1.5 w-1.5 rounded-full bg-lime" />
              {slobodnih > 0
                ? `${slobodnih} ${mnozina(slobodnih, "slobodan termin", "slobodna termina", "slobodnih termina")} ${datum === danas ? "danas" : "tog dana"}`
                : "Padel klub"}
            </span>
            <h1 className="ulaz font-naslov text-[44px] font-bold leading-[0.95] tracking-[-0.025em] sm:text-[64px] lg:text-[76px]" style={{ ["--i" as string]: 1 }}>
              {klub.naziv}
            </h1>
            {klub.adresa && (
              <p className="ulaz flex flex-wrap items-center gap-x-3 gap-y-1 text-[17px] text-night-ink/75" style={{ ["--i" as string]: 2 }}>
                <span className="flex items-center gap-1.5">
                  <MapPin size={19} />
                  {klub.adresa}
                </span>
                {mapa && (
                  <a href={mapa} target="_blank" rel="noreferrer" className="text-sm font-bold text-lime underline-offset-4 hover:underline">
                    Otvori mapu
                  </a>
                )}
              </p>
            )}
            <ul className="ulaz flex flex-wrap gap-2" style={{ ["--i" as string]: 3 }}>
              <Cinjenica ikona={<House size={17} />}>
                {tereniDanas.length} {mnozina(tereniDanas.length, "teren", "terena", "terena")}
                {zatvorenih > 0 && ` · ${zatvorenih} pod krovom`}
              </Cinjenica>
              {otvara !== null && zatvara !== null && (
                <Cinjenica ikona={<Clock size={17} />}>
                  danas {uVreme(otvara)}–{uVreme(zatvara)}
                </Cinjenica>
              )}
              {klub.cenaPoSatuRsd !== null && <Cinjenica ikona={<Tag size={17} />}>{dinari(klub.cenaPoSatuRsd)} / sat</Cinjenica>}
            </ul>
            <div className="ulaz flex flex-wrap gap-3 pt-1" style={{ ["--i" as string]: 4 }}>
              <a
                href="#termini"
                className="group inline-flex h-[54px] items-center gap-3 rounded-full bg-lime pl-6 pr-2 text-[17px] font-bold text-lime-ink shadow-[0_10px_30px_-10px_oklch(0.8_0.2_125)] transition-transform duration-300 ease-glatko active:scale-[0.97]"
              >
                Rezerviši termin
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-ink/10 transition-transform duration-300 ease-glatko group-hover:translate-y-0.5">
                  <ArrowDown size={18} weight="bold" />
                </span>
              </a>
              {klub.telefon && (
                <a
                  href={`tel:${klub.telefon}`}
                  className="inline-flex h-[54px] items-center gap-2 rounded-full bg-white/10 px-6 text-[15px] font-bold ring-1 ring-white/15 transition-colors duration-300 hover:bg-white/15"
                >
                  <Phone size={18} weight="bold" />
                  {lepTelefon(klub.telefon)}
                </a>
              )}
            </div>
          </div>

          <div className="iskoci relative mx-auto w-full max-w-[520px]" style={{ animationDelay: "150ms" }}>
            <div className="rounded-[34px] bg-white/6 p-3 ring-1 ring-white/10">
              <TerenCrtez className="w-full -rotate-2 drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)] transition-transform duration-700 ease-glatko hover:rotate-0" />
            </div>
            {klub.cenaPoSatuRsd !== null && (
              <div className="absolute -bottom-4 left-4 rounded-[18px] bg-surface px-4 py-3 text-ink shadow-plutajuce sm:left-[-18px]">
                <div className="text-xs font-semibold text-muted">90 minuta</div>
                <div className="text-lg font-bold">{dinari(cenaTermina(klub, 90))}</div>
              </div>
            )}
            <div className="absolute -top-3 right-4 flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-sm font-bold text-ink shadow-plutajuce sm:right-[-12px]">
              <CloudSun size={18} className="text-brand" /> {zatvorenih > 0 ? "igra se i kad pada kiša" : "tereni na otvorenom"}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 pt-8 sm:px-6 lg:grid-cols-3">
        <div className={`${kartica} ulaz flex flex-col gap-5 p-5 sm:p-6 lg:col-span-2`}>
          <div className="flex flex-col gap-2">
            <span className={natpis}>O klubu</span>
            <p className="text-[17px] leading-relaxed text-ink/85">
              {klub.opis ?? "Padel tereni za rekreaciju i takmičenje. Rezerviši termin online ili pozovi klub."}
            </p>
          </div>
          {pogodnosti.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pogodnosti.map((p) => (
                <li key={p} className="flex items-center gap-2.5 rounded-2xl bg-surface2 px-3 py-2.5 text-sm font-semibold">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface text-brand shadow-meko">
                    <PogodnostIkona kljuc={p} size={17} />
                  </span>
                  {POGODNOSTI[p]}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`${kartica} ulaz flex flex-col gap-4 p-5 sm:p-6`} style={{ ["--i" as string]: 1 }}>
          <span className={natpis}>Tereni</span>
          <ul className="flex flex-col gap-2">
            {tereniDanas.map((x) => (
              <li key={x.id} className="flex items-center gap-3">
                <span className="relative h-9 w-14 flex-none overflow-hidden rounded-lg bg-brand">
                  <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/90" />
                  <span className="absolute inset-[3px] rounded-[5px] ring-1 ring-white/50" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{x.naziv}</span>
                  <span className="block text-xs text-muted">{x.vrsta === "zatvoren" ? "Pod krovom" : "Na otvorenom"}</span>
                </span>
                <span className="text-xs font-semibold text-muted">
                  {x.intervali.length ? `${uVreme(x.intervali[0].od)}–${uVreme(x.intervali[x.intervali.length - 1].do)}` : "danas ne radi"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="termini" className="mx-auto w-full max-w-[1200px] scroll-mt-24 px-4 pt-12 sm:px-6">
        <div className="flex flex-col gap-2">
          <span className={natpis}>Online rezervacija</span>
          <h2 className={`${naslov} text-[34px] leading-none sm:text-[44px]`}>Izaberi svoj termin</h2>
          <p className="text-[15px] text-muted">Plaćanje u klubu. Otkazivanje besplatno do 12 sati pre početka.</p>
        </div>
      </section>

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

function Cinjenica({ ikona, children }: { ikona: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex h-10 items-center gap-2 rounded-full bg-white/8 px-4 text-sm font-semibold text-night-ink/90 ring-1 ring-white/10">
      <span className="text-lime">{ikona}</span>
      {children}
    </li>
  );
}
