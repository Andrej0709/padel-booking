"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { brojDana, danUNedelji, dinari, kratkiDatum, lepTelefon, mnozina, uVreme } from "@/lib/format";
import type { TerenSaTerminima } from "@/lib/raspored";
import { rezervisiOnline } from "./actions";

type Izbor = { terenId: string; od: number };

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
  const [gotovo, setGotovo] = useState<{ opis: string; cena: number | null } | null>(null);
  const [salje, startTransition] = useTransition();
  const okvirIzbora = useRef<HTMLDivElement>(null);

  const adresa = (d: string, t: number) => `/k/${slug}?dan=${d}&trajanje=${t}`;
  const idi = (d: string, t: number) => router.push(adresa(d, t), { scroll: false });

  const izabraniTeren = izbor ? tereni.find((t) => t.id === izbor.terenId) : undefined;
  const opis = izbor && izabraniTeren
    ? `${izabraniTeren.naziv} · ${kratkiDatum(datum)} · ${uVreme(izbor.od)}–${uVreme(izbor.od + trajanje)}`
    : "";

  useEffect(() => {
    // On a phone the box is below the courts, so bring it into view. On a computer it is already visible.
    if (izbor && !window.matchMedia("(min-width: 1024px)").matches) {
      okvirIzbora.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [izbor]);

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
      setGotovo({ opis, cena: r.cenaRsd ?? null });
    });
  }

  if (gotovo) {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col gap-4 px-5 pb-24 pt-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lime-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h2 className="font-naslov text-[30px] font-bold leading-tight">Termin je rezervisan</h2>
        <div className="flex flex-col gap-1 rounded-[14px] bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
          <strong className="text-lg">{gotovo.opis}</strong>
          <span className="text-muted">
            {ime} · {telefon}
          </span>
          <span className="text-muted">{dinari(gotovo.cena)} · plaćanje u klubu</span>
        </div>
        <p className="text-[15px] leading-relaxed text-muted">
          Termin možeš da otkažeš do 12 sati pre početka u{" "}
          <Link href="/moje-rezervacije" className="font-bold text-brand">
            Mojim rezervacijama
          </Link>
          .
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
          className="h-[50px] rounded-xl border border-line bg-surface text-base font-semibold"
        >
          Nazad na termine
        </button>
      </div>
    );
  }

  return (
    // Phone: one column, the booking box appears under the courts.
    // Computer: courts side by side on the left, the booking box stays visible on the right.
    <div className="mx-auto grid max-w-[1200px] items-start gap-6 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:pt-6">
      <div className="flex min-w-0 flex-col gap-[18px]">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:overflow-visible sm:px-0 xl:grid-cols-14">
        {dani.map((d, i) => {
          const izabran = d === datum;
          return (
            <button
              key={d}
              type="button"
              onClick={() => idi(d, trajanje)}
              aria-pressed={izabran}
              className={`flex h-[60px] w-[52px] flex-none flex-col sm:w-auto items-center justify-center gap-0.5 rounded-xl ${
                izabran ? "bg-ink text-surface" : "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]"
              }`}
            >
              <span className="text-xs font-semibold opacity-80">{i === 0 ? "Danas" : danUNedelji(d)}</span>
              <span className="font-naslov text-[22px] font-bold leading-none">{brojDana(d)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[13px] font-semibold text-muted">Trajanje</div>
        <div className="flex h-11 gap-1 rounded-xl bg-surface2 p-[3px] sm:max-w-[420px]">
          {[60, 90, 120].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => idi(datum, v)}
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

      {tereni.length === 0 && <p className="text-[15px] text-muted">Klub trenutno nema terena za online rezervaciju.</p>}

      <div className="grid gap-4 md:grid-cols-2">
      {tereni.map((t) => {
        const slobodnih = t.termini.filter((x) => x.slobodan).length;
        return (
          <div key={t.id} className="flex flex-col gap-3 rounded-2xl bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)]">
            <div className="flex items-baseline gap-2">
              <strong className="font-naslov text-[19px]">{t.naziv}</strong>
              <span className="text-[13px] text-muted">{t.vrsta === "zatvoren" ? "Zatvoren" : "Otvoren"}</span>
              <span className="ml-auto text-[13px] text-muted">
                {slobodnih} {mnozina(slobodnih, "slobodan", "slobodna", "slobodnih")}
              </span>
            </div>
            {t.termini.length === 0 ? (
              <p className="text-sm text-muted">Nema više termina ovog dana.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5">
                {t.termini.map((x) => {
                  const izabran = izbor?.terenId === t.id && izbor.od === x.od;
                  return (
                    <button
                      key={x.od}
                      type="button"
                      disabled={!x.slobodan}
                      onClick={() => {
                        setGreska(null);
                        setIzbor({ terenId: t.id, od: x.od });
                      }}
                      aria-pressed={izabran}
                      aria-label={`${t.naziv}, ${uVreme(x.od)}${x.slobodan ? "" : ", zauzeto"}`}
                      className={`flex h-[50px] flex-col items-center justify-center rounded-[10px] text-[15px] font-bold ${
                        izabran
                          ? "bg-brand text-white"
                          : x.slobodan
                            ? "border border-line bg-surface text-ink hover:border-brand"
                            : "cursor-not-allowed border border-dashed border-line bg-surface2 text-muted line-through"
                      }`}
                    >
                      <span>{uVreme(x.od)}</span>
                      {!x.slobodan && <span className="text-[10px] font-semibold uppercase tracking-[.04em]">zauzeto</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      </div>
      </div>

      <aside className="lg:sticky lg:top-6">
      {!izbor && (
        <div className="hidden flex-col gap-3 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] lg:flex">
          <span className="text-[13px] font-semibold text-muted">Tvoj termin</span>
          <strong className="font-naslov text-[22px] leading-tight">Izaberi slobodan termin</strong>
          <p className="text-[15px] leading-relaxed text-muted">
            Klikni na vreme kod terena koji želiš. Termin ostaje tvoj tek kad ga potvrdiš ovde.
          </p>
          <dl className="mt-1 flex flex-col gap-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Cena za {trajanje} min</dt>
              <dd className="font-semibold">{dinari(cenaRsd)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Plaćanje</dt>
              <dd className="font-semibold">u klubu</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Otkazivanje</dt>
              <dd className="font-semibold">do 12 h pre termina</dd>
            </div>
            {telefonKluba && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Telefon kluba</dt>
                <dd>
                  <a href={`tel:${telefonKluba}`} className="font-semibold text-brand">
                    {lepTelefon(telefonKluba)}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
      {izbor && (
        <div
          ref={okvirIzbora}
          className="flex scroll-mb-6 flex-col gap-3 rounded-2xl bg-surface p-4 shadow-[0_0_0_2px_var(--brand)]"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-muted">Tvoj termin</span>
            <strong className="text-lg">{opis}</strong>
            <span className="text-sm text-muted">{dinari(cenaRsd)} · plaćanje u klubu</span>
          </div>

          {korisnik ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-muted">Ime</span>
                <input
                  value={ime}
                  onChange={(e) => setIme(e.target.value)}
                  autoComplete="name"
                  className="h-12 rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none focus:border-brand"
                />
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
                  className="h-12 rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none placeholder:text-muted focus:border-brand"
                />
              </label>
              {greska && (
                <p role="alert" className="text-[13px] font-semibold text-danger">
                  {greska}
                </p>
              )}
              <button
                type="button"
                onClick={rezervisi}
                disabled={salje}
                className="h-[54px] rounded-xl bg-lime text-[17px] font-bold text-lime-ink hover:brightness-105 disabled:opacity-60"
              >
                {salje ? "Rezervišem…" : "Rezerviši termin"}
              </button>
              <span className="text-center text-[13px] text-muted">
                Plaćanje u klubu. Otkazivanje do 12 sati pre termina.
              </span>
            </>
          ) : (
            <>
              <p className="text-[15px] text-muted">Za online rezervaciju treba ti nalog. Traje pola minuta.</p>
              <Link
                href={`/prijava?nazad=${encodeURIComponent(adresa(datum, trajanje))}`}
                className="flex h-[54px] items-center justify-center rounded-xl bg-lime text-[17px] font-bold text-lime-ink"
              >
                Prijavi se i rezerviši
              </Link>
              <Link
                href={`/registracija?nazad=${encodeURIComponent(adresa(datum, trajanje))}`}
                className="text-center text-sm font-bold text-brand"
              >
                Nemaš nalog? Napravi ga
              </Link>
            </>
          )}
        </div>
      )}
      </aside>
    </div>
  );
}
