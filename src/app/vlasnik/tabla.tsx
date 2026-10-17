"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { dinari, dugiDatum, lepTelefon, mnozina, uVreme } from "@/lib/format";
import { KORAK, pomeriDatum } from "@/lib/kalendar";
import type { Rezervacija, Teren } from "@/lib/raspored";
import { naslov } from "@/components/ui";
import { blokirajNalog, promeniStatus, upisiTelefonskuRezervaciju } from "./actions";

// Row height comes from CSS (--red), so the phone gets taller rows for fingers.
const red = (redova: number) => `calc(var(--red) * ${redova})`;

const IZGLED: Record<Rezervacija["status"], { naziv: string; oznaka: string; klase: string }> = {
  potvrdjena: {
    naziv: "Potvrđena",
    oznaka: "",
    klase: "bg-conf-bg text-conf-fg shadow-[0_1px_3px_rgba(10,20,50,.18)]",
  },
  odigrana: {
    naziv: "Odigrana",
    oznaka: " · Odigrano",
    klase: "bg-played-bg text-played-fg shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--played-fg)_25%,transparent)]",
  },
  nedolazak: {
    naziv: "Nije došao",
    oznaka: " · Nije došao",
    klase: "bg-ns-bg text-ns-fg shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--ns-fg)_25%,transparent)]",
  },
};

type Prozor = { vrsta: "novi"; terenId: string; od: number } | { vrsta: "detalji"; id: string };

export function Tabla({
  datum,
  danas,
  vremenskaZona,
  tereni,
  rezervacije,
  cenaPoTrajanju,
}: {
  datum: string;
  danas: string;
  vremenskaZona: string;
  tereni: Teren[];
  rezervacije: Rezervacija[];
  cenaPoTrajanju: Record<number, number | null>;
}) {
  const router = useRouter();
  const [prozor, setProzor] = useState<Prozor | null>(null);
  const [preko, setPreko] = useState<string | null>(null);
  const sada = useTrenutniMinut(datum === danas, vremenskaZona);
  const datumPolje = useRef<HTMLInputElement>(null);

  const idi = (d: string) => router.push(d === danas ? "/vlasnik" : `/vlasnik?datum=${d}`);

  const intervali = tereni.flatMap((t) => t.intervali);
  const sviPocetci = [...intervali.map((i) => i.od), ...rezervacije.map((r) => r.od)];
  const sviKrajevi = [...intervali.map((i) => i.do), ...rezervacije.map((r) => r.do)];
  const pocetak = sviPocetci.length ? Math.max(0, Math.floor(Math.min(...sviPocetci) / KORAK) * KORAK) : 480;
  const kraj = sviKrajevi.length ? Math.min(1440, Math.ceil(Math.max(...sviKrajevi) / KORAK) * KORAK) : 1380;
  const redovi = Array.from({ length: (kraj - pocetak) / KORAK }, (_, i) => pocetak + i * KORAK);
  const izabrana = prozor?.vrsta === "detalji" ? rezervacije.find((r) => r.id === prozor.id) : undefined;

  const dugmeOsnova = "flex h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold sm:h-10";
  const dugmeNav = `${dugmeOsnova} border-line bg-surface text-ink hover:bg-surface2`;

  return (
    <>
      {/* Date bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-3 py-2.5 sm:px-6">
        <h1 className={`${naslov} min-w-0 flex-1 text-xl sm:text-[26px]`}>{dugiDatum(datum)}</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => idi(pomeriDatum(datum, -1))} className={dugmeNav} aria-label="Prethodni dan">
            <Strelica levo />
            <span className="hidden sm:inline">Prethodni</span>
          </button>
          <button
            type="button"
            onClick={() => idi(danas)}
            className={datum === danas ? `${dugmeOsnova} border-brand bg-brand text-white` : dugmeNav}
          >
            Danas
          </button>
          <button type="button" onClick={() => idi(pomeriDatum(datum, 1))} className={dugmeNav} aria-label="Sledeći dan">
            <span className="hidden sm:inline">Sledeći</span>
            <Strelica />
          </button>
          <span className="relative">
            <button type="button" onClick={() => datumPolje.current?.showPicker()} className={dugmeNav} aria-label="Izaberi datum">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="2" y="3" width="12" height="11" rx="2" />
                <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
              </svg>
              <span className="hidden sm:inline">Izaberi datum</span>
            </button>
            <input
              ref={datumPolje}
              type="date"
              tabIndex={-1}
              aria-hidden="true"
              value={datum}
              onChange={(e) => e.target.value && idi(e.target.value)}
              className="pointer-events-none absolute inset-0 opacity-0"
            />
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="hidden flex-wrap items-center gap-x-[18px] gap-y-1 border-b border-line bg-surface px-6 py-2 text-[13px] text-muted md:flex">
        <Legenda klase="bg-conf-bg">Potvrđena</Legenda>
        <Legenda klase="bg-played-bg shadow-[inset_0_0_0_1px_var(--played-fg)]">Odigrana</Legenda>
        <Legenda klase="bg-ns-bg shadow-[inset_0_0_0_1px_var(--ns-fg)]">Nije došao</Legenda>
        <Legenda klase="zatvoreno">Teren ne radi</Legenda>
        <span className="flex items-center gap-1.5">
          <Online /> Stiglo online
        </span>
        <span className="ml-auto">Klikni na prazno polje za novu rezervaciju</span>
      </div>

      {tereni.length === 0 ? (
        <p className="p-6 text-muted">
          Klub nema nijedan aktivan teren. Dodaj ga u{" "}
          <Link href="/vlasnik/podesavanja" className="font-semibold text-brand">
            podešavanjima
          </Link>
          .
        </p>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-auto bg-surface [--red:34px] sm:[--red:26px]">
          <div className="relative flex w-max min-w-full">
            {/* Time column */}
            <div className="sticky left-0 z-30 w-[50px] flex-none border-r border-line bg-surface sm:w-[60px]">
              <div className="sticky top-0 z-10 h-14 border-b border-line bg-surface" />
              <div className="relative">
                {redovi.map((m) => (
                  <div
                    key={m}
                    className={`box-border pr-2 pt-[3px] text-right ${m % 60 === 0 ? "text-xs font-bold text-ink" : "text-[11px] font-medium text-muted"}`}
                    style={{ height: "var(--red)" }}
                  >
                    {uVreme(m)}
                  </div>
                ))}
                {sada !== null && sada >= pocetak && sada <= kraj && (
                  <div
                    className="absolute right-[3px] z-10 rounded-[5px] bg-now px-1 py-0.5 text-[11px] font-bold text-white"
                    style={{ top: `calc(${red((sada - pocetak) / KORAK)} - 9px)` }}
                  >
                    {uVreme(sada)}
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex flex-1">
              {tereni.map((teren) => {
                const naTerenu = rezervacije.filter((r) => r.terenId === teren.id);
                const sati = teren.intervali.map((i) => `${uVreme(i.od)}–${uVreme(i.do)}`).join(", ") || "ne radi";
                let prethodnoZatvoreno = false;
                return (
                  <div key={teren.id} className="w-[150px] flex-none sm:w-auto sm:min-w-[180px] sm:flex-1">
                    <div className="sticky top-0 z-20 flex h-14 flex-col justify-center gap-px border-b border-l border-line bg-surface px-3">
                      <div className="font-naslov text-[17px] font-bold">{teren.naziv}</div>
                      <div className="whitespace-nowrap text-xs text-muted">
                        {teren.vrsta === "zatvoren" ? "Zatvoren" : "Otvoren"} · {sati}
                      </div>
                    </div>
                    <div className="relative border-l border-line">
                      {redovi.map((m) => {
                        const otvoreno = teren.intervali.some((i) => i.od <= m && m + KORAK <= i.do);
                        const prvoZatvoreno = !otvoreno && !prethodnoZatvoreno;
                        prethodnoZatvoreno = !otvoreno;
                        const linija = m % 60 === 30 ? "border-b border-line" : "border-b border-dashed border-line2";
                        if (!otvoreno) {
                          return (
                            <div
                              key={m}
                              className={`zatvoreno box-border flex items-center justify-center ${linija}`}
                              style={{ height: "var(--red)" }}
                            >
                              {prvoZatvoreno && (
                                <span className="text-[11px] font-bold uppercase tracking-[.06em] text-muted">Ne radi</span>
                              )}
                            </div>
                          );
                        }
                        const kljuc = `${teren.id}-${m}`;
                        return (
                          <button
                            key={m}
                            type="button"
                            onMouseEnter={() => setPreko(kljuc)}
                            onMouseLeave={() => setPreko((p) => (p === kljuc ? null : p))}
                            onClick={() => setProzor({ vrsta: "novi", terenId: teren.id, od: m })}
                            aria-label={`Nova rezervacija: ${teren.naziv}, ${uVreme(m)}`}
                            className={`box-border flex w-full items-center justify-center transition-colors hover:bg-hover ${linija}`}
                            style={{ height: "var(--red)" }}
                          >
                            {preko === kljuc && <span className="text-[13px] font-bold text-brand">+ {uVreme(m)}</span>}
                          </button>
                        );
                      })}

                      {naTerenu.map((r) => {
                        const od = Math.max(r.od, pocetak);
                        const doM = Math.min(r.do, kraj);
                        const izgled = IZGLED[r.status];
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setProzor({ vrsta: "detalji", id: r.id })}
                            className={`absolute inset-x-1 z-[5] box-border flex flex-col items-start gap-px overflow-hidden rounded-lg px-2 py-1.5 text-left hover:brightness-105 sm:px-[9px] sm:py-[5px] ${izgled.klase}`}
                            style={{
                              top: `calc(${red((od - pocetak) / KORAK)} + 2px)`,
                              height: `calc(${red((doM - od) / KORAK)} - 4px)`,
                            }}
                          >
                            <span className="flex w-full min-w-0 items-center gap-1.5">
                              <span className="truncate text-sm font-bold">{r.ime}</span>
                              {r.izvor === "online" && (
                                <span className="ml-auto flex-none">
                                  <Online />
                                </span>
                              )}
                            </span>
                            <span className="w-full truncate text-xs font-medium">
                              {uVreme(r.od)}–{uVreme(r.do)}
                              {izgled.oznaka}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {sada !== null && sada >= pocetak && sada <= kraj && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-now"
                  style={{ top: `calc(56px + ${red((sada - pocetak) / KORAK)} - 1px)` }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {prozor && (
        <Modal onClose={() => setProzor(null)}>
          {prozor.vrsta === "novi" ? (
            <NovaRezervacija
              datum={datum}
              tereni={tereni}
              rezervacije={rezervacije}
              pocetno={prozor}
              cenaPoTrajanju={cenaPoTrajanju}
              onClose={() => setProzor(null)}
            />
          ) : izabrana ? (
            <Detalji
              r={izabrana}
              teren={tereni.find((t) => t.id === izabrana.terenId)}
              onClose={() => setProzor(null)}
            />
          ) : null}
        </Modal>
      )}
    </>
  );
}

function Strelica({ levo = false }: { levo?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={levo ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
    </svg>
  );
}

function Legenda({ klase, children }: { klase: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded ${klase}`} />
      {children}
    </span>
  );
}

function Online() {
  return (
    <span className="rounded bg-lime px-[5px] py-0.5 text-[10px] font-bold uppercase tracking-[.06em] text-lime-ink">
      online
    </span>
  );
}

// Current minute in the club's time zone, for the red "now" line. Only on today's board.
function useTrenutniMinut(aktivno: boolean, vremenskaZona: string) {
  const [minut, setMinut] = useState<number | null>(null);
  useEffect(() => {
    if (!aktivno) return;
    const izracunaj = () => {
      const delovi = new Intl.DateTimeFormat("en-GB", {
        timeZone: vremenskaZona,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const deo = (tip: string) => Number(delovi.find((d) => d.type === tip)?.value);
      setMinut(deo("hour") * 60 + deo("minute"));
    };
    izracunaj();
    const id = setInterval(izracunaj, 60_000);
    return () => clearInterval(id);
  }, [aktivno, vremenskaZona]);
  return aktivno ? minut : null;
}

// Centered window on a computer, a sheet from the bottom on a phone (one-handed use).
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", naTaster);
    return () => window.removeEventListener("keydown", naTaster);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,14,28,.5)] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-full w-full overflow-auto rounded-t-[22px] bg-surface px-[18px] pb-6 pt-2.5 text-ink shadow-[0_24px_64px_rgba(0,0,0,.3)] sm:w-[460px] sm:rounded-[18px] sm:px-6 sm:pt-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3.5 h-1 w-10 rounded-sm bg-line sm:hidden" />
        {children}
      </div>
    </div>
  );
}

function Zatvori({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Zatvori"
      className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-surface2 text-ink"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M2 2l10 10M12 2L2 12" />
      </svg>
    </button>
  );
}

const oznakaPolja = "text-[13px] font-semibold text-muted";
const poljeKlase =
  "h-12 w-full rounded-xl bg-surface px-3.5 text-base font-medium text-ink outline-none placeholder:text-muted";

function NovaRezervacija({
  datum,
  tereni,
  rezervacije,
  pocetno,
  cenaPoTrajanju,
  onClose,
}: {
  datum: string;
  tereni: Teren[];
  rezervacije: Rezervacija[];
  pocetno: { terenId: string; od: number };
  cenaPoTrajanju: Record<number, number | null>;
  onClose: () => void;
}) {
  const [terenId, setTerenId] = useState(pocetno.terenId);
  const [od, setOd] = useState(pocetno.od);
  const [trajanje, setTrajanje] = useState(90);
  const [ime, setIme] = useState("");
  const [telefon, setTelefon] = useState("");
  const [cena, setCena] = useState<string | null>(null); // null = follow the price list
  const [pokusano, setPokusano] = useState(false);
  const [greskaServera, setGreskaServera] = useState<string | null>(null);
  const [salje, startTransition] = useTransition();

  const teren = tereni.find((t) => t.id === terenId)!;
  const doM = od + trajanje;
  const cenaPolje = cena ?? (cenaPoTrajanju[trajanje]?.toLocaleString("sr-RS") ?? "");

  // Checked here first so the owner sees the problem while the caller is still on the line.
  // The database checks again when saving.
  const problem = !teren.intervali.some((i) => i.od <= od && doM <= i.do)
    ? "Teren ne radi u to vreme."
    : rezervacije.some((r) => r.terenId === terenId && r.od < doM && r.do > od)
      ? "Teren je već zauzet u delu tog vremena. Izaberi drugo vreme ili teren."
      : null;
  const greska = greskaServera ?? problem;

  function sacuvaj() {
    setPokusano(true);
    setGreskaServera(null);
    if (problem || !ime.trim() || !telefon.trim()) return;
    startTransition(async () => {
      const rezultat = await upisiTelefonskuRezervaciju({ terenId, datum, od, trajanje, ime, telefon, cena: cenaPolje });
      if (rezultat.greska) setGreskaServera(rezultat.greska);
      else onClose();
    });
  }

  const promeni = <T,>(postavi: (v: T) => void) => (v: T) => {
    setGreskaServera(null);
    postavi(v);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className={`${naslov} text-[26px] leading-tight`}>Nova rezervacija</h2>
          <div className="mt-1 text-sm text-muted">{dugiDatum(datum)}</div>
        </div>
        <Zatvori onClose={onClose} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={oznakaPolja}>Teren</span>
        <div className="flex flex-wrap gap-1.5">
          {tereni.map((t) => {
            const izabran = t.id === terenId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => promeni(setTerenId)(t.id)}
                aria-pressed={izabran}
                className={`flex h-[52px] min-w-[90px] flex-1 flex-col items-center justify-center rounded-xl ${
                  izabran ? "border-2 border-brand bg-hover text-brand" : "border border-line bg-surface text-ink"
                }`}
              >
                <span className="text-[15px] font-bold">{t.naziv}</span>
                <span className="text-[11px] opacity-75">{t.vrsta === "zatvoren" ? "Zatvoren" : "Otvoren"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3">
        <div className="flex flex-col gap-1.5">
          <span className={oznakaPolja}>Početak</span>
          <div
            className={`flex h-12 items-center rounded-xl bg-surface ${problem ? "border-2 border-danger" : "border border-line"}`}
          >
            <button
              type="button"
              onClick={() => promeni(setOd)(Math.max(0, od - KORAK))}
              aria-label="30 minuta ranije"
              className="h-full w-11 text-xl"
            >
              −
            </button>
            <div className="flex-1 text-center text-xl font-bold">{uVreme(od)}</div>
            <button
              type="button"
              onClick={() => promeni(setOd)(Math.min(1440 - KORAK, od + KORAK))}
              aria-label="30 minuta kasnije"
              className="h-full w-11 text-xl"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={oznakaPolja}>Trajanje</span>
          <div className="flex h-12 gap-1 rounded-xl bg-surface2 p-[3px]">
            {[60, 90, 120].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => promeni(setTrajanje)(v)}
                aria-pressed={trajanje === v}
                className={`flex-1 rounded-[9px] text-sm font-bold ${
                  trajanje === v ? "bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,.15)]" : "text-muted"
                }`}
              >
                {v} min
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-[10px] bg-surface2 px-3 py-2.5 text-sm">
        <span className="text-muted">Termin</span>
        <strong className="text-[15px]">
          {teren.naziv} · {uVreme(od)}–{uVreme(doM)}
        </strong>
      </div>

      {greska && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[10px] bg-ns-bg px-3.5 py-3 text-sm font-semibold leading-snug text-ns-fg">
          <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full bg-danger text-[13px] font-bold text-white">
            !
          </span>
          <span>{greska}</span>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={oznakaPolja}>Ime igrača</span>
        <input
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          placeholder="npr. Nikola"
          autoComplete="off"
          className={`${poljeKlase} ${pokusano && !ime.trim() ? "border-2 border-danger" : "border border-line"}`}
        />
        {pokusano && !ime.trim() && <span className="text-[13px] font-semibold text-danger">Upiši ime igrača.</span>}
      </label>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={oznakaPolja}>Telefon</span>
          <input
            type="tel"
            inputMode="tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="06x xxx xxxx"
            autoComplete="off"
            className={`${poljeKlase} ${pokusano && !telefon.trim() ? "border-2 border-danger" : "border border-line"}`}
          />
          {pokusano && !telefon.trim() && (
            <span className="text-[13px] font-semibold text-danger">Upiši broj telefona.</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={oznakaPolja}>
            Cena <span className="font-medium">(nije obavezno)</span>
          </span>
          <span className="flex h-12 items-center gap-1.5 rounded-xl border border-line bg-surface px-3">
            <input
              inputMode="numeric"
              value={cenaPolje}
              onChange={(e) => setCena(e.target.value)}
              placeholder="4.800"
              className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none"
            />
            <span className="text-sm text-muted">din</span>
          </span>
        </label>
      </div>

      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="h-[52px] rounded-xl border border-line bg-surface px-5 text-base font-semibold"
        >
          Odustani
        </button>
        <button
          type="button"
          onClick={sacuvaj}
          disabled={salje}
          className="h-[52px] flex-1 rounded-xl bg-brand text-base font-bold text-white hover:brightness-110 disabled:opacity-60"
        >
          {salje ? "Čuvam…" : "Sačuvaj rezervaciju"}
        </button>
      </div>
    </div>
  );
}

function Detalji({ r, teren, onClose }: { r: Rezervacija; teren: Teren | undefined; onClose: () => void }) {
  const [potvrdaOtkazivanja, setPotvrdaOtkazivanja] = useState(false);
  const [salje, startTransition] = useTransition();
  const izgled = IZGLED[r.status];
  const ranije = r.nedolasci - (r.status === "nedolazak" ? 1 : 0);

  const postavi = (status: Parameters<typeof promeniStatus>[1], zatvori = false) =>
    startTransition(async () => {
      await promeniStatus(r.id, status);
      if (zatvori) onClose();
    });

  const veliko = "h-[52px] rounded-xl text-base font-bold disabled:opacity-60";

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={`rounded-md px-[9px] py-1 text-xs font-bold ${izgled.klase} shadow-none`}>{izgled.naziv}</span>
            <span
              className={`rounded-md px-[9px] py-1 text-xs font-bold ${
                r.izvor === "online" ? "bg-lime text-lime-ink" : "bg-surface2 text-ink"
              }`}
            >
              {r.izvor === "online" ? "Online" : "Telefon"}
            </span>
          </div>
          <h2 className={`${naslov} text-[32px] leading-none`}>{r.ime}</h2>
        </div>
        <Zatvori onClose={onClose} />
      </div>

      <a
        href={`tel:${r.telefon}`}
        className="flex h-[52px] items-center justify-between rounded-xl bg-surface2 px-4 text-ink"
      >
        <span className="text-lg font-bold tracking-[.01em]">{lepTelefon(r.telefon)}</span>
        <span className="text-sm font-bold text-brand">Pozovi</span>
      </a>

      <Link href={`/vlasnik/igraci/${r.igracId}`} className="-mt-2 self-start text-sm font-bold text-brand">
        Profil igrača →
      </Link>

      {ranije > 0 && (
        <div className="flex items-center gap-2.5 rounded-[10px] bg-ns-bg px-3.5 py-2.5 text-sm font-semibold text-ns-fg">
          <span className="font-naslov text-[22px] font-bold">{ranije}</span>
          <span>
            Ranije nije došao {ranije} {mnozina(ranije, "put", "puta", "puta")}. Pogledaj profil pre potvrde.
          </span>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-[15px]">
        <Podatak naziv="Teren" vrednost={`${teren?.naziv ?? ""} · ${teren?.vrsta === "zatvoren" ? "Zatvoren" : "Otvoren"}`} />
        <Podatak naziv="Vreme" vrednost={`${uVreme(r.od)}–${uVreme(r.do)}`} />
        <Podatak naziv="Cena" vrednost={dinari(r.cenaRsd)} />
        <Podatak naziv="Primljena" vrednost={r.izvor === "online" ? "Online" : "Telefonom"} />
      </dl>

      {potvrdaOtkazivanja ? (
        <div className="flex flex-col gap-2.5 rounded-xl bg-ns-bg p-3.5">
          <div className="font-bold text-ns-fg">Otkazati termin? Nestaje sa rasporeda.</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPotvrdaOtkazivanja(false)}
              className="h-[46px] rounded-xl border border-line bg-surface text-[15px] font-semibold"
            >
              Ne, zadrži
            </button>
            <button
              type="button"
              disabled={salje}
              onClick={() => postavi("otkazana", true)}
              className="h-[46px] rounded-xl bg-danger text-[15px] font-bold text-white disabled:opacity-60"
            >
              Da, otkaži
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={salje}
              aria-pressed={r.status === "odigrana"}
              onClick={() => postavi(r.status === "odigrana" ? "potvrdjena" : "odigrana")}
              className={`${veliko} ${r.status === "odigrana" ? "bg-played-fg text-surface" : "bg-played-bg text-played-fg"}`}
            >
              Odigrano
            </button>
            <button
              type="button"
              disabled={salje}
              aria-pressed={r.status === "nedolazak"}
              onClick={() => postavi(r.status === "nedolazak" ? "potvrdjena" : "nedolazak")}
              className={`${veliko} ${r.status === "nedolazak" ? "bg-ns-fg text-surface" : "bg-ns-bg text-ns-fg"}`}
            >
              Nije došao
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPotvrdaOtkazivanja(true)}
            className="h-[46px] rounded-xl text-[15px] font-bold text-danger hover:bg-ns-bg"
          >
            Otkaži termin
          </button>
          {r.korisnikId && (
            <button
              type="button"
              disabled={salje}
              onClick={() => startTransition(() => blokirajNalog(r.korisnikId!, !r.blokiran))}
              className="text-[13px] font-semibold text-muted underline-offset-2 hover:underline"
            >
              {r.blokiran ? "Nalog je blokiran za online rezervacije. Odblokiraj" : "Blokiraj nalog za online rezervacije"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Podatak({ naziv, vrednost }: { naziv: string; vrednost: string }) {
  return (
    <div>
      <dt className="mb-0.5 text-xs font-semibold text-muted">{naziv}</dt>
      <dd className="font-semibold">{vrednost}</dd>
    </div>
  );
}
