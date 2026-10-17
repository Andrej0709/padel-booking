import { pool } from "@/lib/db";

// Players of one club, as the owner sees them. Players are kept per club (decision 006),
// so every query here is limited to the owner's own club.

export type IgracUListi = {
  id: string;
  ime: string;
  telefon: string;
  ukupno: number;
  nedolasci: number;
  poslednji: string | null; // YYYY-MM-DD of the latest booking
};

export async function pretraziIgrace(klubId: string, vremenskaZona: string, upit: string): Promise<IgracUListi[]> {
  const cifre = upit.replace(/\D/g, "").replace(/^0/, "");
  const { rows } = await pool.query<IgracUListi>(
    `select i.id, i.ime, i.telefon,
            count(r.id) filter (where r.status <> 'otkazana')::int as ukupno,
            count(r.id) filter (where r.status = 'nedolazak')::int as nedolasci,
            to_char(max(r.pocetak at time zone $2), 'YYYY-MM-DD') as poslednji
     from igraci i
     left join rezervacije r on r.igrac_id = i.id
     where i.klub_id = $1
       and ($3 = '' or i.ime ilike '%' || $3 || '%' or ($4 <> '' and i.telefon like '%' || $4 || '%'))
     group by i.id
     order by max(r.pocetak) desc nulls last, i.ime
     limit 200`,
    [klubId, vremenskaZona, upit.trim(), cifre],
  );
  return rows;
}

export type RezervacijaIgraca = {
  id: string;
  datum: string;
  od: string;
  do: string;
  teren: string;
  izvor: "telefon" | "online";
  status: "potvrdjena" | "odigrana" | "nedolazak" | "otkazana";
  cenaRsd: number | null;
  buduca: boolean;
};

export type ProfilIgraca = {
  id: string;
  ime: string;
  telefon: string;
  rezervacije: RezervacijaIgraca[];
  nalozi: { id: string; email: string; blokiran: boolean }[];
};

export async function ucitajProfil(klubId: string, vremenskaZona: string, igracId: string): Promise<ProfilIgraca | null> {
  if (!/^[0-9a-f-]{36}$/i.test(igracId)) return null;
  const igrac = await pool.query<{ id: string; ime: string; telefon: string }>(
    `select id, ime, telefon from igraci where id = $1 and klub_id = $2`,
    [igracId, klubId],
  );
  if (!igrac.rows[0]) return null;

  const [rezervacije, nalozi] = await Promise.all([
    pool.query<RezervacijaIgraca>(
      `select r.id,
              to_char(r.pocetak at time zone $2, 'YYYY-MM-DD') as datum,
              to_char(r.pocetak at time zone $2, 'HH24:MI') as od,
              to_char(r.kraj at time zone $2, 'HH24:MI') as do,
              t.naziv as teren, r.izvor, r.status, r.cena_rsd as "cenaRsd",
              r.pocetak > now() as buduca
       from rezervacije r join tereni t on t.id = r.teren_id
       where r.igrac_id = $1
       order by r.pocetak desc`,
      [igracId, vremenskaZona],
    ),
    // Online accounts that booked under this phone number. The owner may block them (decision 010).
    pool.query<{ id: string; email: string; blokiran: boolean }>(
      `select distinct k.id, k.email,
              exists(select 1 from blokade b where b.korisnik_id = k.id and b.klub_id = $2) as blokiran
       from rezervacije r join korisnici k on k.id = r.korisnik_id
       where r.igrac_id = $1`,
      [igracId, klubId],
    ),
  ]);
  return { ...igrac.rows[0], rezervacije: rezervacije.rows, nalozi: nalozi.rows };
}
