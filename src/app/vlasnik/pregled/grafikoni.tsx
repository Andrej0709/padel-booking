"use client";

import { useState } from "react";
import { dinari, kratkiDatum, mnozina } from "@/lib/format";

// Charts for the owner's overview (decision 013). Drawn by hand, no chart library:
// columns for revenue per day, and a grid of squares for how full each hour of the week is.
// Every mark shows its exact value on hover and on keyboard focus.

type DanZarade = { datum: string; zarada: number; broj: number };

function okruglo(n: number) {
  if (n <= 0) return 1000;
  const red = Math.pow(10, Math.floor(Math.log10(n)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * red >= n) return k * red;
  return 10 * red;
}

function kratko(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("sr-RS", { maximumFractionDigits: 1 })}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

export function GrafikonZarade({ dani }: { dani: DanZarade[] }) {
  const [aktivan, setAktivan] = useState<number | null>(null);
  const max = okruglo(Math.max(...dani.map((d) => d.zarada), 0));
  const podele = [0, 0.5, 1].map((k) => k * max);
  const najveci = dani.reduce((n, d, i) => (d.zarada > dani[n].zarada ? i : n), 0);
  const izabran = aktivan !== null ? dani[aktivan] : null;
  const gusto = dani.length > 40;

  return (
    <div className="relative flex flex-col gap-2">
      <div className="relative h-[180px] sm:h-[210px]">
        {/* Gridlines with round values on the left */}
        {podele.map((v) => (
          <div key={v} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(v / max) * 100}%` }}>
            <span className="w-8 -translate-y-1/2 text-right text-[11px] font-medium text-muted">{kratko(v)}</span>
            <span className="h-px flex-1 -translate-y-1/2 bg-line2" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-10 right-0 flex items-end" onPointerLeave={() => setAktivan(null)}>
          {dani.map((d, i) => {
            const visina = (d.zarada / max) * 100;
            return (
              <button
                key={d.datum}
                type="button"
                onPointerEnter={() => setAktivan(i)}
                onFocus={() => setAktivan(i)}
                onBlur={() => setAktivan(null)}
                aria-label={`${kratkiDatum(d.datum)}: ${dinari(d.zarada)}, ${d.broj} ${mnozina(d.broj, "rezervacija", "rezervacije", "rezervacija")}`}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <span
                  className={`raste block rounded-t-[4px] transition-[filter,opacity] duration-200 ${
                    aktivan === null || aktivan === i ? "opacity-100" : "opacity-45"
                  } ${i === dani.length - 1 ? "bg-lime" : "bg-brand"} group-focus-visible:outline-2 group-focus-visible:outline-brand`}
                  style={{
                    height: `${Math.max(visina, d.zarada > 0 ? 1.5 : 0)}%`,
                    width: gusto ? "calc(100% - 2px)" : "min(24px, calc(100% - 4px))",
                    ["--i" as string]: i,
                  }}
                />
                {i === najveci && d.zarada > 0 && !gusto && (
                  <span
                    className="pointer-events-none absolute whitespace-nowrap text-[11px] font-bold text-ink"
                    style={{ bottom: `calc(${visina}% + 4px)` }}
                  >
                    {kratko(d.zarada)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {izabran && aktivan !== null && (
          <div
            className="iskoci pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 rounded-2xl bg-surface px-3.5 py-2.5 shadow-plutajuce ring-1 ring-line"
            style={{
              left: `calc(40px + (100% - 40px) * ${(aktivan + 0.5) / dani.length})`,
              bottom: `calc(${(izabran.zarada / max) * 100}% + 14px)`,
              translate: aktivan < 3 ? "40% 0" : aktivan > dani.length - 4 ? "-40% 0" : undefined,
            }}
          >
            <div className="text-[17px] font-bold">{dinari(izabran.zarada)}</div>
            <div className="text-xs text-muted">
              {kratkiDatum(izabran.datum)} · {izabran.broj} {mnozina(izabran.broj, "rezervacija", "rezervacije", "rezervacija")}
            </div>
          </div>
        )}
      </div>
      <div className="ml-10 flex justify-between text-[11px] font-medium text-muted">
        <span>{kratkiDatum(dani[0].datum)}</span>
        {dani.length > 2 && <span>{kratkiDatum(dani[Math.floor(dani.length / 2)].datum)}</span>}
        <span>Danas</span>
      </div>
    </div>
  );
}

type Celija = { dan: number; sat: number; ukupno: number; zauzeto: number };
const DANI = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

export function ToplotnaMapa({ celije }: { celije: Celija[] }) {
  const [aktivna, setAktivna] = useState<Celija | null>(null);
  if (celije.length === 0) return <p className="text-sm text-muted">Nema radnog vremena u ovom periodu.</p>;
  const sati = celije.map((c) => c.sat);
  const prvi = Math.min(...sati);
  const poslednji = Math.max(...sati);
  const kolone = Array.from({ length: poslednji - prvi + 1 }, (_, i) => prvi + i);
  const nadji = (dan: number, sat: number) => celije.find((c) => c.dan === dan && c.sat === sat);

  return (
    <div className="flex flex-col gap-3">
      <div className="bez-trake -mx-1 overflow-x-auto px-1 pb-1">
        <div
          className="grid min-w-[560px] gap-[3px]"
          style={{ gridTemplateColumns: `34px repeat(${kolone.length}, minmax(0, 1fr))` }}
          onPointerLeave={() => setAktivna(null)}
        >
          <span />
          {kolone.map((s) => (
            <span key={s} className="pb-1 text-center text-[10px] font-semibold text-muted">
              {s % 2 === 0 ? s : ""}
            </span>
          ))}
          {DANI.map((naziv, i) => (
            <Red key={naziv} naziv={naziv}>
              {kolone.map((s) => {
                const c = nadji(i + 1, s);
                const udeo = c && c.ukupno > 0 ? c.zauzeto / c.ukupno : null;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!c}
                    onPointerEnter={() => c && setAktivna(c)}
                    onFocus={() => c && setAktivna(c)}
                    aria-label={c ? `${naziv} ${s}:00, zauzeto ${Math.round((udeo ?? 0) * 100)}%` : `${naziv} ${s}:00, ne radi`}
                    className={`aspect-square rounded-[5px] transition-transform duration-200 ease-glatko enabled:hover:scale-110 ${
                      aktivna === c && c ? "ring-2 ring-ink ring-offset-1 ring-offset-surface" : ""
                    } ${c ? "" : "zatvoreno opacity-60"}`}
                    style={
                      c
                        ? { background: `color-mix(in oklch, var(--brand) ${Math.round(8 + (udeo ?? 0) * 92)}%, var(--surface2))` }
                        : undefined
                    }
                  />
                );
              })}
            </Red>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span className="min-h-[18px] font-semibold text-ink">
          {aktivna
            ? `${DANI[aktivna.dan - 1]} ${aktivna.sat}:00–${aktivna.sat + 1}:00 · zauzeto ${Math.round((aktivna.zauzeto / aktivna.ukupno) * 100)}% (${aktivna.zauzeto} od ${aktivna.ukupno} sati terena)`
            : "Pređi preko polja za tačan broj"}
        </span>
        <span className="flex items-center gap-2">
          prazno
          <span className="flex gap-[3px]">
            {[0, 0.25, 0.5, 0.75, 1].map((u) => (
              <span
                key={u}
                className="h-3 w-3 rounded-[3px]"
                style={{ background: `color-mix(in oklch, var(--brand) ${Math.round(8 + u * 92)}%, var(--surface2))` }}
              />
            ))}
          </span>
          puno
        </span>
      </div>
    </div>
  );
}

function Red({ naziv, children }: { naziv: string; children: React.ReactNode }) {
  return (
    <>
      <span className="flex items-center text-[11px] font-semibold text-muted">{naziv}</span>
      {children}
    </>
  );
}
