import { pool } from "@/lib/db";

// Times on the schedule are minutes from the club's local midnight (17:30 = 1050),
// so the screen can place blocks without dealing with time zones.

export type Klub = { id: string; naziv: string; vremenskaZona: string };

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
  od: number;
  do: number;
  ime: string;
  telefon: string;
  cenaRsd: number | null;
  status: "potvrdjena" | "odigrana" | "nedolazak";
  izvor: "telefon" | "online";
};

// There is no owner login yet, so the screen always shows the first club (the example club).
export async function ucitajKlub(): Promise<Klub | null> {
  const { rows } = await pool.query<Klub>(
    `select id, naziv, vremenska_zona as "vremenskaZona" from klubovi order by kreirano limit 1`,
  );
  return rows[0] ?? null;
}

export async function ucitajRaspored(klub: Klub, datum: string) {
  const [tereni, rezervacije] = await Promise.all([
    pool.query<Teren>(
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
    ),
    pool.query<Rezervacija>(
      `with dan as (select ($2::date)::timestamp at time zone $3 as pocetak)
       select r.id, r.teren_id as "terenId",
              round(extract(epoch from r.pocetak - dan.pocetak) / 60)::int as od,
              round(extract(epoch from r.kraj - dan.pocetak) / 60)::int as do,
              i.ime, i.telefon, r.cena_rsd as "cenaRsd", r.status, r.izvor
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
    ),
  ]);
  return { tereni: tereni.rows, rezervacije: rezervacije.rows };
}

// Today's date in the club's time zone, as YYYY-MM-DD.
export function danasU(vremenskaZona: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: vremenskaZona }).format(new Date());
}

export function pomeriDatum(datum: string, dana: number): string {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dana);
  return d.toISOString().slice(0, 10);
}

export function jeIspravanDatum(datum: string | undefined): datum is string {
  return !!datum && /^\d{4}-\d{2}-\d{2}$/.test(datum) && !isNaN(Date.parse(datum));
}
