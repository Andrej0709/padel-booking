import { pool } from "@/lib/db";
import { danasU, pomeriDatum, type Klub } from "@/lib/raspored";

// Numbers for the owner's overview (decision 013). Everything is counted in the club's own time zone,
// for the last N days including today, and compared with the N days before that.
//
// Rules used for counting:
// - Revenue is the price of played and confirmed bookings. No-shows and cancelled ones bring nothing.
// - Occupancy is booked minutes divided by open minutes of active courts. A no-show still held the court.

export type Dan = {
  datum: string;
  broj: number;
  zarada: number;
  zauzeto: number; // booked minutes
  otvoreno: number; // open minutes of all active courts
  nedolasci: number;
  online: number;
};

export type Ukupno = {
  broj: number;
  zarada: number;
  zauzeto: number;
  otvoreno: number;
  nedolasci: number;
  online: number;
};

export type Celija = { dan: number; sat: number; ukupno: number; zauzeto: number };
export type PoTerenu = { naziv: string; vrsta: "zatvoren" | "otvoren"; zauzeto: number; otvoreno: number; zarada: number };
export type NajIgrac = { id: string; ime: string; broj: number; zarada: number };
export type DanasnjiTermin = {
  id: string;
  od: string;
  do: string;
  teren: string;
  ime: string;
  izvor: "telefon" | "online";
  status: "potvrdjena" | "odigrana" | "nedolazak";
  cenaRsd: number | null;
  uToku: boolean;
};

export type Pregled = {
  od: string;
  do: string;
  dani: Dan[];
  sada: Ukupno;
  ranije: Ukupno;
  toplotnaMapa: Celija[];
  tereni: PoTerenu[];
  najIgraci: NajIgrac[];
  noviIgraci: number;
  danas: DanasnjiTermin[];
  ocekivano: { broj: number; zarada: number }; // confirmed bookings in the next 7 days
};

function saberi(dani: Dan[]): Ukupno {
  return dani.reduce(
    (u, d) => ({
      broj: u.broj + d.broj,
      zarada: u.zarada + d.zarada,
      zauzeto: u.zauzeto + d.zauzeto,
      otvoreno: u.otvoreno + d.otvoreno,
      nedolasci: u.nedolasci + d.nedolasci,
      online: u.online + d.online,
    }),
    { broj: 0, zarada: 0, zauzeto: 0, otvoreno: 0, nedolasci: 0, online: 0 },
  );
}

export async function ucitajPregled(klub: Klub, brojDana: number): Promise<Pregled> {
  const danas = danasU(klub.vremenskaZona);
  const od = pomeriDatum(danas, -(brojDana - 1));
  const ranijeOd = pomeriDatum(od, -brojDana);
  const p = [klub.id, klub.vremenskaZona];

  // Day boundaries: local midnight of the first day up to local midnight after the last day.
  const granice = `r.pocetak >= ($3::date)::timestamp at time zone $2 and r.pocetak < ($4::date + 1)::timestamp at time zone $2`;

  const [dani, mapa, tereni, igraci, novi, danasnji, ocekivano] = await Promise.all([
    pool.query<Dan>(
      `with dani as (select d::date as dan from generate_series($3::date, $4::date, interval '1 day') d),
       otvoreno as (
         select dani.dan, coalesce(sum(extract(epoch from rv.zatvara - rv.otvara) / 60), 0)::int as minuta
         from dani
         left join tereni t on t.klub_id = $1 and t.aktivan
         left join radno_vreme rv on rv.teren_id = t.id and rv.dan = extract(isodow from dani.dan)
         group by dani.dan
       ),
       rez as (
         select (r.pocetak at time zone $2)::date as dan,
                count(*) filter (where r.status <> 'otkazana')::int as broj,
                coalesce(sum(r.cena_rsd) filter (where r.status in ('odigrana', 'potvrdjena')), 0)::int as zarada,
                coalesce(sum(extract(epoch from r.kraj - r.pocetak) / 60) filter (where r.status <> 'otkazana'), 0)::int as zauzeto,
                count(*) filter (where r.status = 'nedolazak')::int as nedolasci,
                count(*) filter (where r.status <> 'otkazana' and r.izvor = 'online')::int as online
         from rezervacije r join tereni t on t.id = r.teren_id
         where t.klub_id = $1 and ${granice}
         group by 1
       )
       select to_char(dani.dan, 'YYYY-MM-DD') as datum,
              coalesce(rez.broj, 0) as broj, coalesce(rez.zarada, 0) as zarada,
              coalesce(rez.zauzeto, 0) as zauzeto, otvoreno.minuta as otvoreno,
              coalesce(rez.nedolasci, 0) as nedolasci, coalesce(rez.online, 0) as online
       from dani join otvoreno using (dan) left join rez using (dan)
       order by dani.dan`,
      [...p, ranijeOd, danas],
    ),
    // For each day of the week and each hour: how many court-hours were open, and how many held a booking.
    pool.query<Celija>(
      `with dani as (select d::date as dan from generate_series($3::date, $4::date, interval '1 day') d),
       sati as (
         select dani.dan, t.id as teren_id, h,
                (dani.dan + make_time(h, 0, 0)) at time zone $2 as pocetak
         from dani
         join tereni t on t.klub_id = $1 and t.aktivan
         join radno_vreme rv on rv.teren_id = t.id and rv.dan = extract(isodow from dani.dan)
         cross join generate_series(0, 23) as h
         where make_time(h, 0, 0) >= rv.otvara and make_time(h, 0, 0) < rv.zatvara
       )
       select extract(isodow from s.dan)::int as dan, s.h as sat, count(*)::int as ukupno,
              count(*) filter (where exists (
                select 1 from rezervacije r
                where r.teren_id = s.teren_id and r.status <> 'otkazana'
                  and r.pocetak < s.pocetak + interval '1 hour' and r.kraj > s.pocetak
              ))::int as zauzeto
       from sati s
       group by 1, 2
       order by 1, 2`,
      [...p, od, danas],
    ),
    pool.query<PoTerenu>(
      `with dani as (select d::date as dan from generate_series($3::date, $4::date, interval '1 day') d)
       select t.naziv, t.vrsta,
              coalesce((select sum(extract(epoch from r.kraj - r.pocetak) / 60) from rezervacije r
                        where r.teren_id = t.id and r.status <> 'otkazana' and ${granice}), 0)::int as zauzeto,
              coalesce((select sum(extract(epoch from rv.zatvara - rv.otvara) / 60) from dani
                        join radno_vreme rv on rv.teren_id = t.id and rv.dan = extract(isodow from dani.dan)), 0)::int as otvoreno,
              coalesce((select sum(r.cena_rsd) from rezervacije r
                        where r.teren_id = t.id and r.status in ('odigrana', 'potvrdjena') and ${granice}), 0)::int as zarada
       from tereni t
       where t.klub_id = $1 and t.aktivan
       order by t.naziv`,
      [...p, od, danas],
    ),
    pool.query<NajIgrac>(
      `select i.id, i.ime, count(*)::int as broj,
              coalesce(sum(r.cena_rsd) filter (where r.status in ('odigrana', 'potvrdjena')), 0)::int as zarada
       from rezervacije r join igraci i on i.id = r.igrac_id join tereni t on t.id = r.teren_id
       where t.klub_id = $1 and r.status <> 'otkazana' and ${granice}
       group by i.id
       order by broj desc, zarada desc, i.ime
       limit 5`,
      [...p, od, danas],
    ),
    // Players whose very first booking in this club falls into the period.
    pool.query<{ broj: number }>(
      `select count(*)::int as broj from (
         select r.igrac_id, min(r.pocetak) as prvi
         from rezervacije r join tereni t on t.id = r.teren_id
         where t.klub_id = $1 and r.status <> 'otkazana'
         group by r.igrac_id
       ) x
       where x.prvi >= ($3::date)::timestamp at time zone $2 and x.prvi < ($4::date + 1)::timestamp at time zone $2`,
      [...p, od, danas],
    ),
    pool.query<DanasnjiTermin>(
      `select r.id, to_char(r.pocetak at time zone $2, 'HH24:MI') as od, to_char(r.kraj at time zone $2, 'HH24:MI') as do,
              t.naziv as teren, i.ime, r.izvor, r.status, r.cena_rsd as "cenaRsd",
              now() >= r.pocetak and now() < r.kraj as "uToku"
       from rezervacije r join tereni t on t.id = r.teren_id join igraci i on i.id = r.igrac_id
       where t.klub_id = $1 and r.status <> 'otkazana' and ${granice}
       order by r.pocetak, t.naziv`,
      [...p, danas, danas],
    ),
    pool.query<{ broj: number; zarada: number }>(
      `select count(*)::int as broj, coalesce(sum(r.cena_rsd), 0)::int as zarada
       from rezervacije r join tereni t on t.id = r.teren_id
       where t.klub_id = $1 and r.status = 'potvrdjena' and r.pocetak > now() and r.pocetak < now() + interval '7 days'`,
      [klub.id],
    ),
  ]);

  const sviDani = dani.rows;
  const sada = sviDani.filter((d) => d.datum >= od);
  return {
    od,
    do: danas,
    dani: sada,
    sada: saberi(sada),
    ranije: saberi(sviDani.filter((d) => d.datum < od)),
    toplotnaMapa: mapa.rows,
    tereni: tereni.rows,
    najIgraci: igraci.rows,
    noviIgraci: novi.rows[0]?.broj ?? 0,
    danas: danasnji.rows,
    ocekivano: ocekivano.rows[0] ?? { broj: 0, zarada: 0 },
  };
}
