"use client";

import { useActionState, useEffect, useState } from "react";
import type { Rezervacija, Teren } from "@/lib/raspored";
import { promeniStatus, upisiRezervaciju, type StanjeUpisa } from "./actions";

// One row of the board is 30 minutes.
const KORAK = 30;
const VISINA_REDA = 36;
const PX_PO_MINUTU = VISINA_REDA / KORAK;

function uVreme(minuti: number) {
  const m = ((minuti % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const BOJE: Record<Rezervacija["status"], string> = {
  potvrdjena:
    "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-100",
  odigrana:
    "bg-zinc-100 border-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-300",
  nedolazak:
    "bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100",
};

const NAZIV_STATUSA: Record<Rezervacija["status"], string> = {
  potvrdjena: "potvrđena",
  odigrana: "odigrana",
  nedolazak: "nije došao",
};

type Panel =
  | { vrsta: "novi"; terenId: string; od: number }
  | { vrsta: "detalji"; rezervacija: Rezervacija };

export function Tabla({
  datum,
  jeDanas,
  vremenskaZona,
  tereni,
  rezervacije,
}: {
  datum: string;
  jeDanas: boolean;
  vremenskaZona: string;
  tereni: Teren[];
  rezervacije: Rezervacija[];
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const sada = useTrenutniMinut(jeDanas, vremenskaZona);

  const intervali = tereni.flatMap((t) => t.intervali);
  if (tereni.length === 0) return <p>Klub nema nijedan aktivan teren.</p>;
  if (intervali.length === 0) return <p>Svi tereni su zatvoreni ovog dana.</p>;

  // The board spans from the earliest opening to the latest closing,
  // widened if a booking sits outside those hours.
  const sviPocetci = [...intervali.map((i) => i.od), ...rezervacije.map((r) => r.od)];
  const sviKrajevi = [...intervali.map((i) => i.do), ...rezervacije.map((r) => r.do)];
  const pocetak = Math.max(0, Math.floor(Math.min(...sviPocetci) / KORAK) * KORAK);
  const kraj = Math.min(1440, Math.ceil(Math.max(...sviKrajevi) / KORAK) * KORAK);
  const redovi = Array.from({ length: (kraj - pocetak) / KORAK }, (_, i) => pocetak + i * KORAK);
  const visina = (kraj - pocetak) * PX_PO_MINUTU;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div
          className="grid min-w-fit"
          style={{ gridTemplateColumns: `56px repeat(${tereni.length}, minmax(130px, 1fr))` }}
        >
          <div className="sticky left-0 z-20 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
          {tereni.map((t) => (
            <div
              key={t.id}
              className="border-b border-l border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <p className="font-medium">{t.naziv}</p>
              <p className="text-xs text-zinc-500">{t.vrsta}</p>
            </div>
          ))}

          {/* Time column */}
          <div
            className="relative sticky left-0 z-20 bg-white dark:bg-zinc-950"
            style={{ height: visina }}
          >
            {redovi
              .filter((m) => m % 60 === 0)
              .map((m) => (
                <span
                  key={m}
                  className="absolute right-2 -translate-y-1/2 text-xs text-zinc-500"
                  style={{ top: (m - pocetak) * PX_PO_MINUTU }}
                >
                  {m === pocetak ? "" : uVreme(m)}
                </span>
              ))}
          </div>

          {tereni.map((teren) => {
            const naTerenu = rezervacije.filter((r) => r.terenId === teren.id);
            return (
              <div
                key={teren.id}
                className="relative border-l border-zinc-200 dark:border-zinc-800"
                style={{ height: visina }}
              >
                {redovi.map((m) => {
                  const top = (m - pocetak) * PX_PO_MINUTU;
                  const linija =
                    m % 60 === 0
                      ? "border-t border-zinc-200 dark:border-zinc-800"
                      : "border-t border-dashed border-zinc-100 dark:border-zinc-900";
                  const otvoreno = teren.intervali.some((i) => i.od <= m && m + KORAK <= i.do);
                  const zauzeto = naTerenu.some((r) => r.od < m + KORAK && r.do > m);
                  if (!otvoreno) {
                    return (
                      <div
                        key={m}
                        className={`absolute inset-x-0 bg-zinc-100 dark:bg-zinc-900 ${linija}`}
                        style={{ top, height: VISINA_REDA }}
                        title="Teren ne radi"
                      />
                    );
                  }
                  if (zauzeto) {
                    return (
                      <div key={m} className={`absolute inset-x-0 ${linija}`} style={{ top, height: VISINA_REDA }} />
                    );
                  }
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPanel({ vrsta: "novi", terenId: teren.id, od: m })}
                      className={`group absolute inset-x-0 text-left ${linija} hover:bg-emerald-50 dark:hover:bg-emerald-950`}
                      style={{ top, height: VISINA_REDA }}
                      aria-label={`Upiši rezervaciju: ${teren.naziv}, ${uVreme(m)}`}
                    >
                      <span className="hidden px-2 text-xs text-emerald-700 group-hover:inline dark:text-emerald-300">
                        + {uVreme(m)}
                      </span>
                    </button>
                  );
                })}

                {naTerenu.map((r) => {
                  const od = Math.max(r.od, pocetak);
                  const doM = Math.min(r.do, kraj);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setPanel({ vrsta: "detalji", rezervacija: r })}
                      className={`absolute inset-x-1 z-10 overflow-hidden rounded-md border px-2 py-1 text-left text-xs ${BOJE[r.status]}`}
                      style={{ top: (od - pocetak) * PX_PO_MINUTU + 1, height: (doM - od) * PX_PO_MINUTU - 2 }}
                    >
                      <p className="truncate text-sm font-medium">{r.ime}</p>
                      <p className="truncate opacity-80">
                        {uVreme(r.od)}–{uVreme(r.do)}
                        {r.status !== "potvrdjena" && ` · ${NAZIV_STATUSA[r.status]}`}
                        {r.izvor === "online" && " · online"}
                      </p>
                    </button>
                  );
                })}

                {sada !== null && sada >= pocetak && sada <= kraj && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                    style={{ top: (sada - pocetak) * PX_PO_MINUTU }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>Klik na prazno polje upisuje rezervaciju.</span>
        <span><Tacka boja="bg-sky-300" /> potvrđena</span>
        <span><Tacka boja="bg-zinc-300" /> odigrana</span>
        <span><Tacka boja="bg-rose-300" /> nije došao</span>
        <span><Tacka boja="bg-zinc-100 border border-zinc-300" /> teren ne radi</span>
      </p>

      {panel && (
        <Prozor onClose={() => setPanel(null)}>
          {panel.vrsta === "novi" ? (
            <NovaRezervacija
              datum={datum}
              tereni={tereni}
              terenId={panel.terenId}
              od={panel.od}
              onClose={() => setPanel(null)}
            />
          ) : (
            <Detalji
              rezervacija={panel.rezervacija}
              teren={tereni.find((t) => t.id === panel.rezervacija.terenId)}
              onClose={() => setPanel(null)}
            />
          )}
        </Prozor>
      )}
    </>
  );
}

function Tacka({ boja }: { boja: string }) {
  return <span className={`mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle ${boja}`} />;
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

function Prozor({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", naTaster);
    return () => window.removeEventListener("keydown", naTaster);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

const polje =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";
const oznaka = "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

function NovaRezervacija({
  datum,
  tereni,
  terenId,
  od,
  onClose,
}: {
  datum: string;
  tereni: Teren[];
  terenId: string;
  od: number;
  onClose: () => void;
}) {
  const [stanje, posalji, salje] = useActionState<StanjeUpisa, FormData>(upisiRezervaciju, {});

  useEffect(() => {
    if (stanje.uspeh) onClose();
  }, [stanje, onClose]);

  // After an error React clears the form, so the typed values come back as defaults.
  // The key rebuilds the form, because a select ignores a changed default otherwise.
  const unos = stanje.unos ?? {};
  const kljuc = JSON.stringify(unos);

  return (
    <form key={kljuc} action={posalji} className="space-y-3">
      <h2 className="text-lg font-semibold">Nova rezervacija</h2>
      <input type="hidden" name="datum" value={datum} />

      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2">
          <span className={oznaka}>Teren</span>
          <select name="terenId" defaultValue={unos.terenId ?? terenId} className={polje}>
            {tereni.map((t) => (
              <option key={t.id} value={t.id}>
                {t.naziv}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={oznaka}>Početak</span>
          <input type="time" name="vreme" step={900} defaultValue={unos.vreme ?? uVreme(od)} required className={polje} />
        </label>
        <label>
          <span className={oznaka}>Trajanje</span>
          <select name="trajanje" defaultValue={unos.trajanje ?? "90"} className={polje}>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </label>
        <label className="col-span-2">
          <span className={oznaka}>Ime igrača</span>
          <input name="ime" defaultValue={unos.ime} required autoFocus autoComplete="off" className={polje} />
        </label>
        <label className="col-span-2">
          <span className={oznaka}>Telefon</span>
          <input name="telefon" type="tel" defaultValue={unos.telefon} required placeholder="064 123 4567" autoComplete="off" className={polje} />
        </label>
        <label className="col-span-2">
          <span className={oznaka}>Cena (dinara, nije obavezno)</span>
          <input name="cena" type="number" defaultValue={unos.cena} min={0} step={100} placeholder="4800" className={polje} />
        </label>
      </div>

      {stanje.greska && (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {stanje.greska}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Odustani
        </button>
        <button
          type="submit"
          disabled={salje}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salje ? "Upisujem…" : "Upiši"}
        </button>
      </div>
    </form>
  );
}

function Detalji({
  rezervacija: r,
  teren,
  onClose,
}: {
  rezervacija: Rezervacija;
  teren: Teren | undefined;
  onClose: () => void;
}) {
  async function promeni(formData: FormData) {
    if (formData.get("status") === "otkazana" && !confirm(`Otkazati termin za ${r.ime}?`)) return;
    await promeniStatus(formData);
    onClose();
  }

  const dugme = "rounded-md border px-3 py-2 text-sm";

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{r.ime}</h2>
        <a href={`tel:${r.telefon}`} className="text-sm text-sky-700 underline dark:text-sky-300">
          {r.telefon}
        </a>
      </div>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-zinc-500">Teren</dt>
        <dd>{teren?.naziv}</dd>
        <dt className="text-zinc-500">Vreme</dt>
        <dd>
          {uVreme(r.od)}–{uVreme(r.do)}
        </dd>
        <dt className="text-zinc-500">Cena</dt>
        <dd>{r.cenaRsd === null ? "—" : `${r.cenaRsd.toLocaleString("sr-RS")} din`}</dd>
        <dt className="text-zinc-500">Primljeno</dt>
        <dd>{r.izvor === "telefon" ? "telefonom" : "online"}</dd>
        <dt className="text-zinc-500">Status</dt>
        <dd>{NAZIV_STATUSA[r.status]}</dd>
      </dl>

      <form action={promeni} className="flex flex-wrap gap-2 pt-1">
        <input type="hidden" name="id" value={r.id} />
        {r.status === "potvrdjena" ? (
          <>
            <button name="status" value="odigrana" className={`${dugme} border-zinc-300 dark:border-zinc-700`}>
              Odigrano
            </button>
            <button name="status" value="nedolazak" className={`${dugme} border-rose-300 text-rose-800 dark:border-rose-700 dark:text-rose-200`}>
              Nije došao
            </button>
          </>
        ) : (
          <button name="status" value="potvrdjena" className={`${dugme} border-zinc-300 dark:border-zinc-700`}>
            Vrati na potvrđenu
          </button>
        )}
        <button name="status" value="otkazana" className={`${dugme} border-zinc-300 dark:border-zinc-700`}>
          Otkaži termin
        </button>
      </form>

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Zatvori
        </button>
      </div>
    </div>
  );
}
