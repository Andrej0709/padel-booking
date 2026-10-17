import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  DeviceMobile,
  Lightning,
  Phone,
  UserPlus,
  Warning,
} from "@phosphor-icons/react/ssr";
import { zahtevajVlasnika } from "@/lib/pristup";
import { ucitajPregled, type Ukupno } from "@/lib/statistika";
import { dinari, dugiDatum, inicijali, mnozina } from "@/lib/format";
import { kartica, naslov, natpis } from "@/components/ui";
import { VlasnikOkvir } from "../okvir";
import { GrafikonZarade, ToplotnaMapa } from "./grafikoni";

export const metadata = { title: "Pregled" };

const PERIODI = [7, 30, 90] as const;

export default function Page({ searchParams }: PageProps<"/vlasnik/pregled">) {
  return (
    <Suspense fallback={<Kostur />}>
      <Sadrzaj searchParams={searchParams} />
    </Suspense>
  );
}

function Kostur() {
  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-4 p-4 sm:p-6 lg:grid-cols-4">
      <div className="ucitava h-10 rounded-full lg:col-span-4" />
      <div className="ucitava h-[340px] rounded-[22px] lg:col-span-2 lg:row-span-2" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="ucitava h-[160px] rounded-[22px]" />
      ))}
    </div>
  );
}

// Percent change against the previous period, or null when there is nothing to compare with.
function promena(sada: number, ranije: number) {
  if (ranije === 0) return null;
  return Math.round(((sada - ranije) / ranije) * 100);
}

const udeo = (u: Ukupno) => (u.otvoreno ? Math.round((u.zauzeto / u.otvoreno) * 100) : 0);
const udeoNedolazaka = (u: Ukupno) => (u.broj ? Math.round((u.nedolasci / u.broj) * 1000) / 10 : 0);

function Promena({ vrednost, dobroKadRaste = true, naTamnom = false }: { vrednost: number | null; dobroKadRaste?: boolean; naTamnom?: boolean }) {
  if (vrednost === null) return <span className={`text-xs ${naTamnom ? "text-night-ink/60" : "text-muted"}`}>nema poređenja</span>;
  const raste = vrednost >= 0;
  const dobro = vrednost === 0 || raste === dobroKadRaste;
  const Ikona = raste ? ArrowUpRight : ArrowDownRight;
  const boja = naTamnom
    ? dobro
      ? "bg-lime/20 text-lime"
      : "bg-[oklch(0.65_0.2_25/0.25)] text-[oklch(0.85_0.1_25)]"
    : dobro
      ? "bg-played-bg text-played-fg"
      : "bg-ns-bg text-ns-fg";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${boja}`}>
      <Ikona size={13} weight="bold" />
      {raste ? "+" : "−"}
      {Math.abs(vrednost)}%
    </span>
  );
}

async function Sadrzaj({ searchParams }: Pick<PageProps<"/vlasnik/pregled">, "searchParams">) {
  const clan = await zahtevajVlasnika("/vlasnik/pregled");
  const trazeno = Number((await searchParams).dana);
  const brojDana = (PERIODI as readonly number[]).includes(trazeno) ? trazeno : 30;
  const p = await ucitajPregled(clan.klub, brojDana);
  const { sada, ranije } = p;

  const danasZarada = p.danas.filter((t) => t.status !== "nedolazak").reduce((z, t) => z + (t.cenaRsd ?? 0), 0);
  const onlineUdeo = sada.broj ? Math.round((sada.online / sada.broj) * 100) : 0;
  const maxTeren = Math.max(...p.tereni.map((t) => (t.otvoreno ? t.zauzeto / t.otvoreno : 0)), 0.01);

  return (
    <VlasnikOkvir clan={clan} aktivno="pregled">
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-7">
        <div className="ulaz flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className={natpis}>Pregled kluba</span>
            <h1 className={`${naslov} text-[34px] leading-none sm:text-[42px]`}>Kako klub radi</h1>
            <p className="text-[15px] text-muted">
              Poslednjih {brojDana} dana, zaključno sa danas. Poređenje je sa {brojDana} dana pre toga.
            </p>
          </div>
          {/* One filter row above everything: every number below follows the chosen period. */}
          <div className="flex h-11 gap-1 rounded-full bg-surface p-1 shadow-meko ring-1 ring-line">
            {PERIODI.map((d) => (
              <Link
                key={d}
                href={`/vlasnik/pregled?dana=${d}`}
                scroll={false}
                aria-current={brojDana === d ? "page" : undefined}
                className={`flex items-center rounded-full px-4 text-sm font-bold transition-colors duration-300 ease-glatko ${
                  brojDana === d ? "bg-ink text-surface" : "text-muted hover:text-ink"
                }`}
              >
                {d} dana
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* The one headline number: revenue in the period, with revenue per day below it. */}
          <section className="ulaz nocno-nebo relative flex flex-col gap-5 overflow-hidden rounded-[26px] p-5 sm:col-span-2 sm:p-6 lg:row-span-2" style={{ ["--i" as string]: 1 }}>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-night-ink/70">Zarada</span>
              <span className="whitespace-nowrap font-naslov text-[40px] font-bold leading-none tracking-[-0.02em] [font-variant-numeric:normal] xl:text-[54px]">
                {dinari(sada.zarada)}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-night-ink/70">
                <Promena vrednost={promena(sada.zarada, ranije.zarada)} naTamnom />
                <span>pre toga {dinari(ranije.zarada)}</span>
                <span className="text-night-ink/40">·</span>
                <span>prosek {dinari(Math.round(sada.zarada / brojDana))} dnevno</span>
              </span>
            </div>
            <div className="mt-auto rounded-[20px] bg-surface p-4 text-ink">
              <div className="mb-6 flex items-center justify-between text-sm">
                <span className="font-semibold">Zarada po danu</span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-lime" /> danas
                </span>
              </div>
              <GrafikonZarade dani={p.dani.map((d) => ({ datum: d.datum, zarada: d.zarada, broj: d.broj }))} />
            </div>
          </section>

          <Plocica i={2} naslov="Popunjenost" vrednost={`${udeo(sada)}%`} promena={<Promena vrednost={promena(udeo(sada), udeo(ranije))} />}>
            <div className="h-2 overflow-hidden rounded-full bg-hover">
              <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-glatko" style={{ width: `${udeo(sada)}%` }} />
            </div>
            <span className="text-xs text-muted">
              {Math.round(sada.zauzeto / 60)} od {Math.round(sada.otvoreno / 60)} sati terena
            </span>
          </Plocica>

          <Plocica i={3} naslov="Rezervacije" vrednost={String(sada.broj)} promena={<Promena vrednost={promena(sada.broj, ranije.broj)} />}>
            <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
              <div className="h-full rounded-l-full bg-brand" style={{ width: `${100 - onlineUdeo}%` }} />
              <div className="h-full rounded-r-full bg-lime" style={{ width: `${onlineUdeo}%` }} />
            </div>
            <span className="flex flex-wrap gap-x-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Phone size={13} /> telefon {100 - onlineUdeo}%
              </span>
              <span className="flex items-center gap-1">
                <DeviceMobile size={13} /> online {onlineUdeo}%
              </span>
            </span>
          </Plocica>

          <Plocica
            i={4}
            naslov="Nedolasci"
            vrednost={`${udeoNedolazaka(sada).toLocaleString("sr-RS")}%`}
            promena={<Promena vrednost={promena(sada.nedolasci, ranije.nedolasci)} dobroKadRaste={false} />}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Warning size={14} className="text-ns-fg" />
              {sada.nedolasci} {mnozina(sada.nedolasci, "termin", "termina", "termina")} bez igrača
            </span>
          </Plocica>

          <Plocica i={5} naslov="Narednih 7 dana" vrednost={dinari(p.ocekivano.zarada)}>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <CalendarCheck size={14} className="text-brand" />
              {p.ocekivano.broj} {mnozina(p.ocekivano.broj, "zakazan termin", "zakazana termina", "zakazanih termina")}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <UserPlus size={14} className="text-brand" />
              {p.noviIgraci} {mnozina(p.noviIgraci, "novi igrač", "nova igrača", "novih igrača")} u periodu
            </span>
          </Plocica>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className={`${kartica} ulaz flex min-w-0 flex-col gap-4 p-5 sm:p-6 lg:col-span-2`} style={{ ["--i" as string]: 6 }}>
            <div className="flex flex-col gap-1">
              <h2 className={`${naslov} text-[22px]`}>Kad je najgušće</h2>
              <p className="text-sm text-muted">Zauzetost terena po danu u nedelji i satu. Tamnije znači punije.</p>
            </div>
            <ToplotnaMapa celije={p.toplotnaMapa} />
          </section>

          <section className={`${kartica} ulaz flex flex-col gap-4 p-5 sm:p-6`} style={{ ["--i" as string]: 7 }}>
            <div className="flex flex-col gap-1">
              <h2 className={`${naslov} text-[22px]`}>Tereni</h2>
              <p className="text-sm text-muted">Popunjenost i zarada po terenu.</p>
            </div>
            <ul className="flex flex-col gap-4">
              {p.tereni.map((t) => {
                const u = t.otvoreno ? t.zauzeto / t.otvoreno : 0;
                return (
                  <li key={t.naziv} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">
                        {t.naziv} <span className="text-xs font-medium text-muted">{t.vrsta}</span>
                      </span>
                      <span className="text-sm font-bold">{Math.round(u * 100)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-hover">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.round(u * 100)}%`, opacity: 0.55 + 0.45 * (u / maxTeren) }}
                      />
                    </div>
                    <span className="text-xs text-muted">{dinari(t.zarada)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className={`${kartica} ulaz flex flex-col gap-4 p-5 sm:p-6`} style={{ ["--i" as string]: 8 }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className={`${naslov} text-[22px]`}>Danas</h2>
                <p className="text-sm text-muted">{dugiDatum(p.do)}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{dinari(danasZarada)}</div>
                <div className="text-xs text-muted">
                  {p.danas.length} {mnozina(p.danas.length, "termin", "termina", "termina")}
                </div>
              </div>
            </div>
            {p.danas.length === 0 ? (
              <p className="text-sm text-muted">Danas nema rezervacija.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {p.danas.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${t.uToku ? "bg-hover" : ""}`}
                  >
                    <span className="w-[92px] flex-none text-sm font-bold">
                      {t.od}–{t.do}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-semibold">{t.ime}</span> <span className="text-muted">· {t.teren}</span>
                    </span>
                    {t.uToku ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-lime-ink">
                        <span className="puls h-1.5 w-1.5 rounded-full bg-lime-ink" /> u toku
                      </span>
                    ) : t.status === "odigrana" ? (
                      <span className="rounded-full bg-played-bg px-2 py-0.5 text-[11px] font-bold text-played-fg">odigrano</span>
                    ) : t.status === "nedolazak" ? (
                      <span className="rounded-full bg-ns-bg px-2 py-0.5 text-[11px] font-bold text-ns-fg">nije došao</span>
                    ) : (
                      <span className="text-muted" title={t.izvor === "online" ? "Online" : "Telefonom"}>
                        {t.izvor === "online" ? <DeviceMobile size={16} /> : <Phone size={16} />}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${kartica} ulaz flex flex-col gap-4 p-5 sm:p-6`} style={{ ["--i" as string]: 9 }}>
            <div className="flex flex-col gap-1">
              <h2 className={`${naslov} text-[22px]`}>Najaktivniji igrači</h2>
              <p className="text-sm text-muted">Po broju termina u periodu.</p>
            </div>
            <ol className="flex flex-col gap-1">
              {p.najIgraci.map((ig, i) => (
                <li key={ig.id}>
                  <Link
                    href={`/vlasnik/igraci/${ig.id}`}
                    className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-surface2"
                  >
                    <span className="w-4 text-sm font-bold text-muted">{i + 1}</span>
                    <span
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold ${
                        i === 0 ? "bg-lime text-lime-ink" : "bg-hover text-brand"
                      }`}
                    >
                      {inicijali(ig.ime)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{ig.ime}</span>
                      <span className="block text-xs text-muted">{dinari(ig.zarada)}</span>
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold">
                      {i === 0 && <Lightning size={15} weight="fill" className="text-lime-ink [[data-tema=tamna]_&]:text-lime" />}
                      {ig.broj}
                    </span>
                  </Link>
                </li>
              ))}
              {p.najIgraci.length === 0 && <p className="text-sm text-muted">Nema rezervacija u ovom periodu.</p>}
            </ol>
          </section>
        </div>
      </main>
    </VlasnikOkvir>
  );
}

function Plocica({
  i,
  naslov: tekst,
  vrednost,
  promena,
  children,
}: {
  i: number;
  naslov: string;
  vrednost: string;
  promena?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className={`${kartica} ulaz flex flex-col gap-3 p-5`} style={{ ["--i" as string]: i }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted">{tekst}</span>
        {promena}
      </div>
      <span className="font-naslov text-[34px] font-bold leading-none tracking-[-0.02em] [font-variant-numeric:normal]">{vrednost}</span>
      {children}
    </section>
  );
}
