import { pool } from "@/lib/db";
import { KORAK } from "@/lib/kalendar";

// Pure date helpers live in kalendar.ts so browser code can use them without pulling in the database.
export { danasU, jeIspravanDatum, KORAK, pomeriDatum, sadaUMinutima, TRAJANJA } from "@/lib/kalendar";

// Times on the schedule are minutes from the club's local midnight (17:30 = 1050),
// so the screens can place blocks without dealing with time zones.

export type Klub = {
  id: string;
  naziv: string;
  slug: string;
  adresa: string | null;
  telefon: string | null;
  vremenskaZona: string;
  cenaPoSatuRsd: number | null;
  opis: string | null;
  pogodnosti: string[];
};

export type Teren = {
  id: string;
  naziv: string;
  vrsta: "zatvoren" | "otvoren";
  // Opening hours for this day. Empty means the court is closed that day.
  intervali: { od: number; do: number }[];
};

export type Rezervacija = {
  id: string;
  terenId: string;
  igracId: string;
  od: number;
  do: number;
  ime: string;
  telefon: string;
  cenaRsd: number | null;
  status: "potvrdjena" | "odigrana" | "nedolazak";
  izvor: "telefon" | "online";
  korisnikId: string | null;
  // All no-shows of this player in the club, including this booking if it is one.
  nedolasci: number;
  // The online account that made it is blocked from booking online in this club.
  blokiran: boolean;
};


const KLUB_KOLONE = `id, naziv, slug, adresa, telefon, vremenska_zona as "vremenskaZona",
  cena_po_satu_rsd as "cenaPoSatuRsd", opis, pogodnosti`;

export async function ucitajKlubPoSlugu(slug: string): Promise<Klub | null> {
  const { rows } = await pool.query<Klub>(`select ${KLUB_KOLONE} from klubovi where slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function prviKlub(): Promise<Klub | null> {
  const { rows } = await pool.query<Klub>(`select ${KLUB_KOLONE} from klubovi order by kreirano limit 1`);
  return rows[0] ?? null;
}

export async function ucitajTerene(klub: Klub, datum: string): Promise<Teren[]> {
  const { rows } = await pool.query<Teren>(
    `select t.id, t.naziv, t.vrsta,
            coalesce(
              json_agg(json_build_object(
                'od', extract(epoch from rv.otvara) / 60,
                'do', extract(epoch from rv.zatvara) / 60
              ) order by rv.otvara) filter (where rv.id is not null),
              '[]'
            ) as intervali
     from tereni t
     left join radno_vreme rv
       on rv.teren_id = t.id and rv.dan = extract(isodow from $2::date)
     where t.klub_id = $1 and t.aktivan
     group by t.id
     order by t.naziv`,
    [klub.id, datum],
  );
  return rows;
}

export async function ucitajRezervacije(klub: Klub, datum: string): Promise<Rezervacija[]> {
  const { rows } = await pool.query<Rezervacija>(
    `with dan as (select ($2::date)::timestamp at time zone $3 as pocetak)
     select r.id, r.teren_id as "terenId", r.igrac_id as "igracId",
            round(extract(epoch from r.pocetak - dan.pocetak) / 60)::int as od,
            round(extract(epoch from r.kraj - dan.pocetak) / 60)::int as do,
            i.ime, i.telefon, r.cena_rsd as "cenaRsd", r.status, r.izvor,
            r.korisnik_id as "korisnikId",
            (select count(*)::int from rezervacije r2
             where r2.igrac_id = r.igrac_id and r2.status = 'nedolazak') as nedolasci,
            exists(select 1 from blokade b
                   where b.korisnik_id = r.korisnik_id and b.klub_id = t.klub_id) as blokiran
     from rezervacije r
     join tereni t on t.id = r.teren_id
     join igraci i on i.id = r.igrac_id
     cross join dan
     where t.klub_id = $1
       and r.status <> 'otkazana'
       and r.pocetak < dan.pocetak + interval '1 day'
       and r.kraj > dan.pocetak
     order by r.pocetak`,
    [klub.id, datum, klub.vremenskaZona],
  );
  return rows;
}

export type Termin = { od: number; slobodan: boolean };
export type TerenSaTerminima = { id: string; naziv: string; vrsta: Teren["vrsta"]; termini: Termin[] };

// Free start times for the player screen, every 30 minutes.
// Only "free" or "taken" leaves the server: never names or phone numbers of other players.
export async function slobodniTermini(
  klub: Klub,
  datum: string,
  trajanje: number,
  odMinuta: number,
): Promise<TerenSaTerminima[]> {
  const [tereni, rezervacije] = await Promise.all([ucitajTerene(klub, datum), ucitajRezervacije(klub, datum)]);
  return tereni.map((t) => {
    const zauzeto = rezervacije.filter((r) => r.terenId === t.id);
    const termini: Termin[] = [];
    for (const i of t.intervali) {
      for (let od = Math.ceil(i.od / KORAK) * KORAK; od + trajanje <= i.do; od += KORAK) {
        if (od < odMinuta) continue;
        termini.push({ od, slobodan: !zauzeto.some((r) => r.od < od + trajanje && r.do > od) });
      }
    }
    return { id: t.id, naziv: t.naziv, vrsta: t.vrsta, termini };
  });
}

export function cenaTermina(klub: Pick<Klub, "cenaPoSatuRsd">, trajanje: number): number | null {
  return klub.cenaPoSatuRsd === null ? null : Math.round((klub.cenaPoSatuRsd * trajanje) / 60);
}

