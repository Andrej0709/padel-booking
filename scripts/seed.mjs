// Fills the database with one example club, so the tables can be seen in Neon.
// Safe to run again: it removes the previous example club first.
// Run with: npm run db:seed
//
// Test accounts (local development only, emails are printed in the server log, never sent):
//   owner:  vlasnik@primer.rs / Primer-lozinka-2026  (in the club team below)
//   player: igrac@primer.rs   / Primer-lozinka-2026  (not in any team)
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
  insert into klubovi (naziv, slug, adresa, telefon, cena_po_satu_rsd)
  values ($1, 'padel-centar', 'Primer ulica 1, Beograd', '+381110000000', 3200)
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
  ('Ivana',  '+381648888888')
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
