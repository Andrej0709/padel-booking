import Link from "next/link";
import { Suspense } from "react";
import { pool } from "@/lib/db";
import { zahtevajVlasnika } from "@/lib/pristup";
import { lepTelefon } from "@/lib/format";
import { kartica, naslov, oznaka, polje } from "@/components/ui";
import { Obrazac } from "@/components/obrazac";
import { VlasnikOkvir } from "../okvir";
import { dodajTeren, sacuvajKlub, sacuvajTeren } from "./actions";

export const metadata = { title: "Podešavanja" };

const DANI = ["Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja"];

type TerenSaSatima = {
  id: string;
  naziv: string;
  vrsta: "zatvoren" | "otvoren";
  aktivan: boolean;
  sati: { dan: number; otvara: string; zatvara: string }[];
};

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Učitavam podešavanja…</p>}>
      <Podesavanja />
    </Suspense>
  );
}

async function Podesavanja() {
  const clan = await zahtevajVlasnika("/vlasnik/podesavanja");
  const { klub } = clan;
  const { rows: tereni } = await pool.query<TerenSaSatima>(
    `select t.id, t.naziv, t.vrsta, t.aktivan,
            coalesce(json_agg(json_build_object(
              'dan', rv.dan, 'otvara', to_char(rv.otvara, 'HH24:MI'), 'zatvara', to_char(rv.zatvara, 'HH24:MI')
            ) order by rv.dan) filter (where rv.id is not null), '[]') as sati
     from tereni t left join radno_vreme rv on rv.teren_id = t.id
     where t.klub_id = $1
     group by t.id
     order by t.naziv`,
    [klub.id],
  );

  const sekcija = `${kartica} flex flex-col gap-4 p-5 sm:p-6`;
  const podnaslov = `${naslov} text-[22px]`;

  return (
    <VlasnikOkvir clan={clan} aktivno="podesavanja">
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-6 sm:px-5">
        <h1 className={`${naslov} text-[32px]`}>Podešavanja</h1>

        <section className={sekcija}>
          <h2 className={podnaslov}>Klub</h2>
          <Obrazac akcija={sacuvajKlub} dugme="Sačuvaj">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={oznaka}>Naziv</span>
                <input name="naziv" defaultValue={klub.naziv} required className={polje} />
              </label>
              <label>
                <span className={oznaka}>Telefon kluba</span>
                <input name="telefon" type="tel" defaultValue={klub.telefon ? lepTelefon(klub.telefon) : ""} className={polje} />
              </label>
              <label className="sm:col-span-2">
                <span className={oznaka}>Adresa</span>
                <input name="adresa" defaultValue={klub.adresa ?? ""} className={polje} />
              </label>
              <label>
                <span className={oznaka}>Cena po satu (din)</span>
                <input
                  name="cena"
                  inputMode="numeric"
                  defaultValue={klub.cenaPoSatuRsd ?? ""}
                  placeholder="3200"
                  className={polje}
                />
              </label>
              <p className="self-end pb-1 text-sm text-muted">
                Jedna cena za ceo klub (Odluka 011). Termin od 90 minuta košta 1,5 sat. Cenu pojedinačne
                rezervacije i dalje možeš da promeniš ručno.
              </p>
            </div>
          </Obrazac>
          <p className="text-sm text-muted">
            Stranica za igrače:{" "}
            <Link href={`/k/${klub.slug}`} className="font-semibold text-brand">
              /k/{klub.slug}
            </Link>
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={podnaslov}>Tereni i radno vreme</h2>
          {tereni.map((t) => (
            <div key={t.id} className={sekcija}>
              <Obrazac akcija={sacuvajTeren} dugme={`Sačuvaj ${t.naziv}`}>
                <input type="hidden" name="terenId" value={t.id} />
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                  <label>
                    <span className={oznaka}>Naziv</span>
                    <input name="naziv" defaultValue={t.naziv} required className={polje} />
                  </label>
                  <label>
                    <span className={oznaka}>Vrsta</span>
                    <select name="vrsta" defaultValue={t.vrsta} className={polje}>
                      <option value="zatvoren">Zatvoren</option>
                      <option value="otvoren">Otvoren</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2.5 self-end pb-3 text-[15px] font-semibold">
                    <input name="aktivan" type="checkbox" defaultChecked={t.aktivan} className="h-5 w-5 accent-[var(--brand)]" />
                    Aktivan
                  </label>
                </div>
                <p className="-mt-2 text-sm text-muted">
                  Neaktivan teren (na primer zatvoren preko zime) ne vidi se u rasporedu i ne naplaćuje se (Odluka 003).
                </p>
                <fieldset className="flex flex-col gap-1.5">
                  <legend className={oznaka}>Radno vreme</legend>
                  {DANI.map((naziv, i) => {
                    const dan = i + 1;
                    const s = t.sati.find((x) => x.dan === dan);
                    return (
                      <div key={dan} className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 sm:grid-cols-[160px_140px_140px]">
                        <label className="flex items-center gap-2 text-[15px] font-semibold">
                          <input
                            type="checkbox"
                            name={`radi-${dan}`}
                            defaultChecked={!!s}
                            className="h-5 w-5 accent-[var(--brand)]"
                          />
                          <span className="w-24">{naziv}</span>
                        </label>
                        <input
                          type="time"
                          step={1800}
                          name={`otvara-${dan}`}
                          defaultValue={s?.otvara ?? "08:00"}
                          aria-label={`${naziv}, otvara`}
                          className={`${polje} h-11`}
                        />
                        <input
                          type="time"
                          step={1800}
                          name={`zatvara-${dan}`}
                          defaultValue={s?.zatvara ?? "23:00"}
                          aria-label={`${naziv}, zatvara`}
                          className={`${polje} h-11`}
                        />
                      </div>
                    );
                  })}
                </fieldset>
              </Obrazac>
            </div>
          ))}

          <div className={sekcija}>
            <h3 className="text-lg font-bold">Novi teren</h3>
            <Obrazac akcija={dodajTeren} dugme="Dodaj teren">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className={oznaka}>Naziv</span>
                  <input name="naziv" placeholder="Teren 5" required className={polje} />
                </label>
                <label>
                  <span className={oznaka}>Vrsta</span>
                  <select name="vrsta" className={polje}>
                    <option value="zatvoren">Zatvoren</option>
                    <option value="otvoren">Otvoren</option>
                  </select>
                </label>
              </div>
            </Obrazac>
          </div>
        </section>
      </main>
    </VlasnikOkvir>
  );
}
