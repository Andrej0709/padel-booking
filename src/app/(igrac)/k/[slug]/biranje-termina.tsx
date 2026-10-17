"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, CalendarCheck, CalendarPlus, Check, MoonStars, Sun, SunHorizon, X } from "@phosphor-icons/react";
import { brojDana, danUNedelji, dinari, kratkiDatum, lepTelefon, mnozina, uVreme } from "@/lib/format";
import { TRAJANJA } from "@/lib/kalendar";
import type { TerenSaTerminima } from "@/lib/raspored";
import { rezervisiOnline } from "./actions";

type Izbor = { terenId: string; od: number };

// Parts of the day, so a long list of times reads in three short groups.
const DELOVI = [
  { naziv: "Pre podne", do: 12 * 60, Ikona: SunHorizon },
  { naziv: "Popodne", do: 17 * 60, Ikona: Sun },
  { naziv: "Uveče", do: 24 * 60, Ikona: MoonStars },
];

const mesec = (d: string) =>
  new Intl.DateTimeFormat("sr-Latn-RS", { month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`)).replace(".", "");

export function BiranjeTermina({
  slug,
  dani,
  datum,
  trajanje,
  tereni,
  cenaRsd,
  telefonKluba,
  korisnik,
}: {
  slug: string;
  dani: string[];
  datum: string;
  trajanje: number;
  tereni: TerenSaTerminima[];
  cenaRsd: number | null;
  telefonKluba: string | null;
  korisnik: { ime: string; telefon: string } | null;
}) {
  const router = useRouter();
  const [izbor, setIzbor] = useState<Izbor | null>(null);
  const [ime, setIme] = useState(korisnik?.ime ?? "");
  const [telefon, setTelefon] = useState(korisnik?.telefon ?? "");
  const [greska, setGreska] = useState<string | null>(null);
  const [gotovo, setGotovo] = useState<{ opis: string; cena: number | null; id?: string } | null>(null);
  const [salje, startTransition] = useTransition();
  const [menja, startMenjanje] = useTransition();

  const adresa = (d: string, t: number) => `/k/${slug}?dan=${d}&trajanje=${t}`;
  const idi = (d: string, t: number) => startMenjanje(() => router.push(adresa(d, t), { scroll: false }));

  const izabraniTeren = izbor ? tereni.find((t) => t.id === izbor.terenId) : undefined;
  const opis =
    izbor && izabraniTeren ? `${izabraniTeren.naziv} · ${kratkiDatum(datum)} · ${uVreme(izbor.od)}–${uVreme(izbor.od + trajanje)}` : "";
  const korak = gotovo ? 4 : izbor ? 3 : 2;

  function rezervisi() {
    if (!izbor) return;
    if (!ime.trim() || !telefon.trim()) {
      setGreska("Upiši ime i broj telefona.");
      return;
    }
    setGreska(null);
    startTransition(async () => {
      const r = await rezervisiOnline({ slug, terenId: izbor.terenId, datum, od: izbor.od, trajanje, ime, telefon });
      if (r.prijava) {
        router.push(`/prijava?nazad=${encodeURIComponent(adresa(datum, trajanje))}`);
        return;
      }
      if (r.greska) {
        setGreska(r.greska);
        return;
      }
      setGotovo({ opis, cena: r.cenaRsd ?? null, id: r.id });
      window.scrollTo({ top: document.getElementById("termini")?.offsetTop ?? 0, behavior: "smooth" });
    });
  }

  if (gotovo) {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-5 px-5 pb-24 pt-8 text-center">
        <div className="iskoci relative flex h-20 w-20 items-center justify-center rounded-full bg-lime shadow-[0_16px_40px_-12px_oklch(0.8_0.2_125)]">
          <span className="puls absolute inset-0 rounded-full" />
          <Check size={38} weight="bold" className="text-lime-ink" />
        </div>
        <div className="ulaz flex flex-col gap-1" style={{ ["--i" as string]: 1 }}>
          <h3 className="font-naslov text-[34px] font-bold leading-tight tracking-[-0.02em]">Vidimo se na terenu!</h3>
          <p className="text-muted">Termin je tvoj. Potvrda je u Mojim terminima.</p>
        </div>
        <div
          className="ulaz w-full rounded-[26px] bg-surface2 p-1.5 ring-1 ring-line/70"
          style={{ ["--i" as string]: 2 }}
        >
          <div className="flex flex-col gap-1 rounded-[20px] bg-surface p-5 text-left shadow-meko">
            <strong className="text-lg">{gotovo.opis}</strong>
            <span className="text-muted">
              {ime} · {telefon}
            </span>
            <span className="text-muted">{dinari(gotovo.cena)} · plaćanje u klubu</span>
          </div>
        </div>
        <div className="ulaz grid w-full gap-2 sm:grid-cols-2" style={{ ["--i" as string]: 3 }}>
          {gotovo.id && (
            <a
              href={`/api/kalendar/${gotovo.id}`}
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-5 font-bold text-surface transition-transform duration-300 ease-glatko active:scale-[0.97]"
            >
              <CalendarPlus size={20} weight="bold" /> Dodaj u kalendar
            </a>
          )}
          <Link
            href="/moje-rezervacije"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-surface px-5 font-bold ring-1 ring-line transition-transform duration-300 ease-glatko active:scale-[0.97]"
          >
            <CalendarCheck size={20} weight="bold" /> Moji termini
          </Link>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Otkazivanje do 12 sati pre početka u Mojim terminima.
          {telefonKluba && (
            <>
              {" "}
              Posle toga pozovi klub:{" "}
              <a href={`tel:${telefonKluba}`} className="font-bold text-brand">
                {lepTelefon(telefonKluba)}
              </a>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setGotovo(null);
            setIzbor(null);
          }}
          className="text-sm font-bold text-brand"
        >
          Rezerviši još jedan termin
        </button>
      </div>
    );
  }

  const indeksTrajanja = (TRAJANJA as readonly number[]).indexOf(trajanje);

  return (
    <div className="mx-auto grid w-full max-w-[1200px] items-start gap-6 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:pb-24">
      <div className="flex min-w-0 flex-col gap-6">
        <Koraci korak={korak} />

        <div className="flex flex-col gap-3">
          <div className="bez-trake -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:scroll-px-1 lg:px-1">
            {dani.map((d, i) => {
              const izabran = d === datum;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => idi(d, trajanje)}
                  aria-pressed={izabran}
                  className={`flex h-[78px] w-[62px] flex-none snap-start flex-col items-center justify-center gap-0.5 rounded-[20px] transition-[transform,background-color,box-shadow] duration-300 ease-glatko active:scale-95 ${
                    izabran ? "scale-[1.04] bg-ink text-surface shadow-kartica" : "bg-surface text-ink shadow-meko ring-1 ring-line hover:ring-brand/50"
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-[0.08em] ${izabran ? "text-lime" : "text-muted"}`}>
                    {i === 0 ? "Danas" : danUNedelji(d)}
                  </span>
                  <span className="font-naslov text-[24px] font-bold leading-none">{brojDana(d)}</span>
                  <span className={`text-[11px] ${izabran ? "opacity-70" : "text-muted"}`}>{mesec(d)}</span>
                </button>
              );
            })}
          </div>

          <div className="relative flex h-12 rounded-full bg-surface2 p-1 ring-1 ring-line/60 sm:max-w-[420px]">
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 rounded-full bg-surface shadow-kartica transition-transform duration-500 ease-glatko"
              style={{ width: `calc((100% - 8px) / ${TRAJANJA.length})`, transform: `translateX(${indeksTrajanja * 100}%)` }}
            />
            {TRAJANJA.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => idi(datum, v)}
                aria-pressed={trajanje === v}
                className={`relative flex-1 rounded-full text-sm font-bold transition-colors duration-300 ${trajanje === v ? "text-ink" : "text-muted"}`}
              >
                {v} min
              </button>
            ))}
          </div>
        </div>

        {tereni.length === 0 && <p className="text-[15px] text-muted">Klub trenutno nema terena za online rezervaciju.</p>}

        <div className={`grid gap-4 transition-opacity duration-300 md:grid-cols-2 ${menja ? "opacity-50" : ""}`}>
          {tereni.map((t, ti) => {
            const slobodnih = t.termini.filter((x) => x.slobodan).length;
            let prethodni = 0;
            return (
              <div key={t.id} className="ulaz flex flex-col gap-4 rounded-[24px] bg-surface p-4 shadow-kartica ring-1 ring-line/60 sm:p-5" style={{ ["--i" as string]: ti }}>
                <div className="flex items-center gap-3">
                  <span className="relative h-10 w-16 flex-none overflow-hidden rounded-xl bg-brand">
                    <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/90" />
                    <span className="absolute inset-[4px] rounded-[7px] ring-1 ring-white/50" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block font-naslov text-[20px] leading-tight">{t.naziv}</strong>
                    <span className="text-[13px] text-muted">{t.vrsta === "zatvoren" ? "Pod krovom" : "Na otvorenom"}</span>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${slobodnih > 0 ? "bg-played-bg text-played-fg" : "bg-surface2 text-muted"}`}
                  >
                    {slobodnih} {mnozina(slobodnih, "slobodan", "slobodna", "slobodnih")}
                  </span>
                </div>
                {t.termini.length === 0 ? (
                  <p className="text-sm text-muted">Nema više termina ovog dana.</p>
                ) : (
                  DELOVI.map(({ naziv, do: granica, Ikona }) => {
                    const termini = t.termini.filter((x) => x.od >= prethodni && x.od < granica);
                    prethodni = granica;
                    if (termini.length === 0) return null;
                    return (
                      <div key={naziv} className="flex flex-col gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                          <Ikona size={14} weight="bold" /> {naziv}
                        </span>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(74px,1fr))] gap-2">
                          {termini.map((x) => {
                            const izabran = izbor?.terenId === t.id && izbor.od === x.od;
                            return (
                              <button
                                key={x.od}
                                type="button"
                                disabled={!x.slobodan}
                                onClick={() => {
                                  setGreska(null);
                                  setIzbor(izabran ? null : { terenId: t.id, od: x.od });
                                }}
                                aria-pressed={izabran}
                                aria-label={`${t.naziv}, ${uVreme(x.od)}${x.slobodan ? "" : ", zauzeto"}`}
                                className={`h-11 rounded-full text-[15px] font-bold transition-[transform,background-color,color,box-shadow] duration-300 ease-glatko ${
                                  izabran
                                    ? "scale-105 bg-brand text-white shadow-[0_8px_20px_-8px_var(--brand)]"
                                    : x.slobodan
                                      ? "bg-surface2 text-ink hover:bg-hover hover:text-brand active:scale-95"
                                      : "cursor-not-allowed text-muted/60 line-through"
                                }`}
                              >
                                {uVreme(x.od)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Computer: a summary box stays visible on the right. Phone: it slides up from the bottom when a time is picked. */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        {izbor ? (
          <div key={`${izbor.terenId}-${izbor.od}`} className="iskoci rounded-[28px] bg-surface2 p-1.5 ring-1 ring-line/70">
            <div className="rounded-[23px] bg-surface p-5 shadow-kartica">
              <Potvrda
                opis={opis}
                cenaRsd={cenaRsd}
                korisnik={korisnik}
                ime={ime}
                telefon={telefon}
                setIme={setIme}
                setTelefon={setTelefon}
                greska={greska}
                salje={salje}
                rezervisi={rezervisi}
                prijava={adresa(datum, trajanje)}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-[28px] bg-surface p-6 shadow-kartica ring-1 ring-line/60">
            <span className="text-[13px] font-semibold text-muted">Tvoj termin</span>
            <strong className="font-naslov text-[24px] leading-tight">Izaberi slobodno vreme</strong>
            <p className="text-[15px] leading-relaxed text-muted">Klikni na vreme kod terena koji želiš. Termin je tvoj tek kad ga potvrdiš.</p>
            <dl className="flex flex-col gap-2.5 border-t border-line pt-4 text-sm">
              <Red naziv={`Cena za ${trajanje} min`} vrednost={dinari(cenaRsd)} />
              <Red naziv="Plaćanje" vrednost="u klubu" />
              <Red naziv="Otkazivanje" vrednost="do 12 h pre termina" />
              {telefonKluba && (
                <Red
                  naziv="Telefon kluba"
                  vrednost={
                    <a href={`tel:${telefonKluba}`} className="text-brand">
                      {lepTelefon(telefonKluba)}
                    </a>
                  }
                />
              )}
            </dl>
          </div>
        )}
      </aside>

      {izbor && (
        <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
          <div className="zatamni fixed inset-0 bg-night/40" onClick={() => setIzbor(null)} />
          <div className="izvuci relative max-h-[85dvh] overflow-auto rounded-t-[30px] bg-surface px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 shadow-plutajuce">
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-line" />
            <button
              type="button"
              onClick={() => setIzbor(null)}
              aria-label="Zatvori"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface2"
            >
              <X size={18} weight="bold" />
            </button>
            <Potvrda
              opis={opis}
              cenaRsd={cenaRsd}
              korisnik={korisnik}
              ime={ime}
              telefon={telefon}
              setIme={setIme}
              setTelefon={setTelefon}
              greska={greska}
              salje={salje}
              rezervisi={rezervisi}
              prijava={adresa(datum, trajanje)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Red({ naziv, vrednost }: { naziv: string; vrednost: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{naziv}</dt>
      <dd className="font-semibold">{vrednost}</dd>
    </div>
  );
}

function Koraci({ korak }: { korak: number }) {
  const koraci = ["Dan i trajanje", "Vreme", "Potvrda"];
  return (
    <ol className="flex items-center gap-2">
      {koraci.map((k, i) => {
        const broj = i + 1;
        const gotov = korak > broj;
        const aktivan = korak === broj;
        return (
          <li key={k} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold transition-colors duration-500 ease-glatko ${
                  gotov ? "bg-lime text-lime-ink" : aktivan ? "bg-brand text-white" : "bg-surface2 text-muted ring-1 ring-line"
                }`}
              >
                {gotov ? <Check size={14} weight="bold" /> : broj}
              </span>
              <span className={`whitespace-nowrap text-sm font-semibold ${aktivan ? "text-ink" : "text-muted"} ${aktivan ? "" : "hidden sm:inline"}`}>
                {k}
              </span>
            </span>
            {broj < koraci.length && (
              <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full origin-left bg-lime transition-transform duration-700 ease-glatko"
                  style={{ transform: `scaleX(${gotov ? 1 : 0})` }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Potvrda({
  opis,
  cenaRsd,
  korisnik,
  ime,
  telefon,
  setIme,
  setTelefon,
  greska,
  salje,
  rezervisi,
  prijava,
}: {
  opis: string;
  cenaRsd: number | null;
  korisnik: { ime: string; telefon: string } | null;
  ime: string;
  telefon: string;
  setIme: (v: string) => void;
  setTelefon: (v: string) => void;
  greska: string | null;
  salje: boolean;
  rezervisi: () => void;
  prijava: string;
}) {
  const polje =
    "h-12 rounded-2xl border border-line bg-surface px-4 text-base font-medium outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_4px_var(--hover)]";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 pr-10">
        <span className="text-[13px] font-semibold text-muted">Tvoj termin</span>
        <strong className="font-naslov text-[22px] leading-tight">{opis}</strong>
        <span className="text-sm text-muted">{dinari(cenaRsd)} · plaćanje u klubu</span>
      </div>

      {korisnik ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Ime</span>
            <input value={ime} onChange={(e) => setIme(e.target.value)} autoComplete="name" className={polje} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Broj telefona</span>
            <input
              type="tel"
              inputMode="tel"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="06x xxx xxxx"
              autoComplete="tel"
              className={polje}
            />
          </label>
          {greska && (
            <p role="alert" className="rounded-2xl bg-ns-bg px-4 py-3 text-[13px] font-semibold text-ns-fg">
              {greska}
            </p>
          )}
          <button
            type="button"
            onClick={rezervisi}
            disabled={salje}
            className="group flex h-[56px] items-center justify-between rounded-full bg-lime pl-6 pr-2 text-[17px] font-bold text-lime-ink shadow-[0_10px_30px_-10px_oklch(0.8_0.2_125)] transition-transform duration-300 ease-glatko active:scale-[0.97] disabled:opacity-60"
          >
            {salje ? "Rezervišem…" : "Potvrdi rezervaciju"}
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-ink/10 transition-transform duration-300 ease-glatko group-hover:translate-x-0.5">
              <ArrowRight size={18} weight="bold" />
            </span>
          </button>
          <span className="text-center text-[13px] text-muted">Otkazivanje besplatno do 12 sati pre termina.</span>
        </>
      ) : (
        <>
          <p className="text-[15px] text-muted">Za online rezervaciju treba ti nalog. Traje pola minuta.</p>
          <Link
            href={`/prijava?nazad=${encodeURIComponent(prijava)}`}
            className="flex h-[56px] items-center justify-center rounded-full bg-lime text-[17px] font-bold text-lime-ink transition-transform duration-300 ease-glatko active:scale-[0.97]"
          >
            Prijavi se i rezerviši
          </Link>
          <Link href={`/registracija?nazad=${encodeURIComponent(prijava)}`} className="text-center text-sm font-bold text-brand">
            Nemaš nalog? Napravi ga
          </Link>
        </>
      )}
    </div>
  );
}
