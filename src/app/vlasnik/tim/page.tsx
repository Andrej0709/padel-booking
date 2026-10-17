import { Suspense } from "react";
import { pool } from "@/lib/db";
import { zahtevajVlasnika } from "@/lib/pristup";
import { kartica, naslov, oznaka, polje } from "@/components/ui";
import { Obrazac } from "@/components/obrazac";
import { VlasnikOkvir } from "../okvir";
import { dodajClana } from "./actions";
import { DugmeUkloni } from "./dugme-ukloni";

export const metadata = { title: "Tim" };

type ClanTima = { id: string; ime: string; email: string; uloga: "vlasnik" | "recepcija"; stanje: string };

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Učitavam tim…</p>}>
      <Tim />
    </Suspense>
  );
}

async function Tim() {
  const clan = await zahtevajVlasnika("/vlasnik/tim");
  // "stanje" tells the owner whether the person has already logged in with that email.
  const { rows: clanovi } = await pool.query<ClanTima>(
    `select v.id, v.ime, v.email, v.uloga,
            case when k.id is null then 'nije se prijavio'
                 when not k.email_potvrdjen then 'email nije potvrđen'
                 else 'aktivan' end as stanje
     from vlasnici v left join korisnici k on lower(k.email) = lower(v.email)
     where v.klub_id = $1
     order by v.uloga desc, v.ime`,
    [clan.klub.id],
  );

  return (
    <VlasnikOkvir clan={clan} aktivno="tim">
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-6 sm:px-5">
        <div>
          <h1 className={`${naslov} text-[32px]`}>Tim</h1>
          <p className="mt-1 text-[15px] text-muted">
            Ljudi koji vide raspored i igrače. Svako ima svoj nalog, bez deljenja lozinke (Odluka 009).
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {clanovi.map((c) => (
            <div key={c.id} className={`${kartica} flex flex-wrap items-center gap-x-4 gap-y-2 px-[18px] py-3.5`}>
              <div className="min-w-[180px] flex-1">
                <div className="font-bold">{c.ime}</div>
                <div className="text-sm text-muted">{c.email}</div>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-xs font-bold ${c.uloga === "vlasnik" ? "bg-conf-bg text-conf-fg" : "bg-surface2 text-ink"}`}
              >
                {c.uloga === "vlasnik" ? "Vlasnik" : "Recepcija"}
              </span>
              <span className={`text-sm font-semibold ${c.stanje === "aktivan" ? "text-played-fg" : "text-muted"}`}>
                {c.stanje}
              </span>
              {c.email.toLowerCase() !== clan.korisnik.email.toLowerCase() && <DugmeUkloni id={c.id} ime={c.ime} />}
            </div>
          ))}
        </div>

        <section className={`${kartica} flex flex-col gap-4 p-5 sm:p-6`}>
          <h2 className={`${naslov} text-[22px]`}>Dodaj člana</h2>
          <Obrazac akcija={dodajClana} dugme="Dodaj">
            <div className="grid gap-4 sm:grid-cols-[1fr_1.3fr_auto]">
              <label>
                <span className={oznaka}>Ime</span>
                <input name="ime" required className={polje} />
              </label>
              <label>
                <span className={oznaka}>Email</span>
                <input name="email" type="email" required className={polje} />
              </label>
              <label>
                <span className={oznaka}>Uloga</span>
                <select name="uloga" className={polje}>
                  <option value="recepcija">Recepcija</option>
                  <option value="vlasnik">Vlasnik</option>
                </select>
              </label>
            </div>
            <p className="-mt-1 text-sm text-muted">
              Član se prijavljuje sa ovim emailom (lozinkom ili Google-om). Recepcija vidi raspored i igrače, a
              podešavanja i tim samo vlasnik.
            </p>
          </Obrazac>
        </section>
      </main>
    </VlasnikOkvir>
  );
}
