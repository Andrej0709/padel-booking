// Fills the database with one example club, so the tables can be seen in Neon.
// Safe to run again: it removes the previous example club first.
// Run with: npm run db:seed
//
// Test accounts (local development only, emails are printed in the server log, never sent):
//   owner:  vlasnik@primer.rs  (in the club team below)
//   player: igrac@primer.rs    (not in any team)
// Their password is TEST_LOZINKA in .env.local, never in this file: the repository is public
// and the same database serves the live site (decision 012). Set it with npm run db:test-lozinke.
// Accounts are not deleted by this script. If they do not exist yet, sign up on /registracija
// and open the confirmation link from the server log.
import pg from "pg";

process.loadEnvFile(".env.local");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });

const KLUB = "Padel Centar (primer)";

const sql = `
begin;

delete from rezervacije where teren_id in (
  select t.id from tereni t join klubovi k on k.id = t.klub_id where k.naziv = $1
);
delete from klubovi where naziv = $1;

with klub as (
  insert into klubovi (naziv, slug, adresa, telefon, cena_po_satu_rsd, opis, pogodnosti)
  values ($1, 'padel-centar', 'Primer ulica 1, Beograd', '+381110000000', 3200,
          'Četiri terena sa panoramskim staklom, dva pod krovom i dva napolju. Reketi i loptice na recepciji, posle meča kafa na terasi.',
          array['parking', 'svlacionica', 'tus', 'kafic', 'oprema', 'osvetljenje'])
  returning id
),
vlasnik as (
  insert into vlasnici (klub_id, ime, email, uloga)
  select id, 'Vlasnik Primer', 'vlasnik@primer.rs', 'vlasnik' from klub
),
teren as (
  insert into tereni (klub_id, naziv, vrsta)
  select id, v.naziv, v.vrsta::vrsta_terena
  from klub, (values
    ('Teren 1', 'zatvoren'), ('Teren 2', 'otvoren'),
    ('Teren 3', 'zatvoren'), ('Teren 4', 'otvoren')
  ) as v(naziv, vrsta)
  returning id, naziv
),
radno as (
  -- Teren 4 is outdoors without lights, so it opens later and closes earlier.
  insert into radno_vreme (teren_id, dan, otvara, zatvara)
  select teren.id, d,
         case when teren.naziv = 'Teren 4' then time '09:00' else time '08:00' end,
         case when teren.naziv = 'Teren 4' then time '21:00' else time '23:00' end
  from teren, generate_series(1, 7) as d
)
insert into igraci (klub_id, ime, telefon)
select klub.id, v.ime, v.telefon
from klub, (values
  ('Nikola', '+381641111111'),
  ('Jelena', '+381642222222'),
  ('Stefan', '+381643333333'),
  ('Marko',  '+381644444444'),
  ('Ana',    '+381645555555'),
  ('Milan',  '+381646666666'),
  ('Luka',   '+381647777777'),
  ('Ivana',  '+381648888888'),
  ('Petar',  '+381651010101'),
  ('Milica', '+381652020202'),
  ('Vuk',    '+381653030303'),
  ('Teodora','+381654040404'),
  ('Đorđe',  '+381655050505'),
  ('Sara',   '+381656060606'),
  ('Aleksa', '+381657070707'),
  ('Nina',   '+381658080808'),
  ('Uroš',   '+381659090909'),
  ('Katarina','+381601212121'),
  ('Filip',  '+381602323232'),
  ('Maja',   '+381603434343')
) as v(ime, telefon);

-- Bookings are placed relative to today (in Belgrade), so the schedule always has something to show.
insert into rezervacije (teren_id, igrac_id, pocetak, kraj, cena_rsd, status, izvor)
select t.id, i.id, p.pocetak, p.pocetak + make_interval(mins => v.trajanje),
       3200 * v.trajanje / 60, v.status::status_rezervacije, v.izvor::izvor_rezervacije
from (values
  ('Teren 1', 'Milan',   0, '09:00',  90, 'odigrana',   'telefon'),
  ('Teren 3', 'Luka',    0, '10:00',  90, 'nedolazak',  'telefon'),
  ('Teren 2', 'Ana',     0, '12:00',  60, 'odigrana',   'online'),
  ('Teren 3', 'Ivana',   0, '16:00',  90, 'potvrdjena', 'telefon'),
  ('Teren 1', 'Nikola',  0, '17:00',  90, 'potvrdjena', 'telefon'),
  ('Teren 2', 'Jelena',  0, '17:30',  90, 'potvrdjena', 'online'),
  ('Teren 2', 'Marko',   0, '19:00',  90, 'potvrdjena', 'online'),
  ('Teren 1', 'Stefan',  0, '20:30',  90, 'potvrdjena', 'telefon'),
  ('Teren 1', 'Nikola',  1, '18:00',  90, 'potvrdjena', 'telefon'),
  ('Teren 2', 'Ana',     1, '19:30',  90, 'potvrdjena', 'online'),
  ('Teren 3', 'Stefan',  2, '20:00', 120, 'potvrdjena', 'telefon'),
  -- Marko's history: one no-show, which the schedule and his profile warn about.
  ('Teren 1', 'Marko',  -7, '19:00',  90, 'odigrana',   'telefon'),
  ('Teren 2', 'Marko', -14, '20:30',  90, 'nedolazak',  'online'),
  ('Teren 1', 'Marko', -16, '18:00',  90, 'odigrana',   'telefon'),
  ('Teren 2', 'Marko', -28, '19:00',  90, 'odigrana',   'online')
) as v(teren, igrac, dan, vreme, trajanje, status, izvor)
join klubovi k on k.naziv = $1
join tereni t on t.klub_id = k.id and t.naziv = v.teren
join igraci i on i.klub_id = k.id and i.ime = v.igrac
cross join lateral (
  select ((now() at time zone k.vremenska_zona)::date + v.dan + v.vreme::time)
         at time zone k.vremenska_zona as pocetak
) p;

-- A busy history for the owner's overview: the last 35 days and the next 6, on a 90-minute grid.
-- Evenings and weekends fill up more, like in a real club. The grid is the same every run
-- (hash of court, day and slot), and rows that would overlap the bookings above are skipped.
with k as (select * from klubovi where naziv = $1),
spisak as (select array_agg(id order by ime) as ids from igraci where klub_id = (select id from k)),
mesta as (
  select t.id as teren_id, d, s,
         (hashtext(t.naziv || ':' || d || ':' || s)::bigint & 2147483647) as h,
         ((now() at time zone k.vremenska_zona)::date + d
           + case when t.naziv = 'Teren 4' then time '09:00' else time '08:00' end
           + make_interval(mins => s * 90)) at time zone k.vremenska_zona as pocetak,
         case when t.naziv = 'Teren 4' then 7 else 9 end as poslednji
  from k
  join tereni t on t.klub_id = k.id
  cross join generate_series(-35, 6) as d
  cross join generate_series(0, 9) as s
  where d <> 0
)
insert into rezervacije (teren_id, igrac_id, pocetak, kraj, cena_rsd, status, izvor)
select m.teren_id, spisak.ids[1 + m.h % array_length(spisak.ids, 1)],
       m.pocetak, m.pocetak + interval '90 minutes', 4800,
       (case when m.pocetak > now() then 'potvrdjena'
             when m.h % 29 = 0 then 'nedolazak'
             else 'odigrana' end)::status_rezervacije,
       (case when m.h % 5 < 2 then 'online' else 'telefon' end)::izvor_rezervacije
from mesta m, spisak
where m.s <= m.poslednji
  and (m.h / 7) % 100 <
      (case when m.s >= 6 then 78 when m.s >= 4 then 42 else 22 end)
      + (case when extract(isodow from m.pocetak) >= 6 then 14 else 0 end)
      - (case when m.d > 0 then m.d * 9 else 0 end)
on conflict do nothing;

commit;
`;

await client.connect();
try {
  // Multiple statements cannot take parameters, so the club name is inlined safely.
  await client.query(sql.replaceAll("$1", client.escapeLiteral(KLUB)));
  const { rows } = await client.query(
    `select (select count(*) from tereni) as tereni,
            (select count(*) from igraci) as igraci,
            (select count(*) from rezervacije) as rezervacije`,
  );
  console.log("Primer podaci ubačeni:", rows[0]);
} finally {
  await client.end();
}
