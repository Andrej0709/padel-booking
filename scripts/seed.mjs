// Fills the database with one example club, so the tables can be seen in Neon.
// Safe to run again: it removes the previous example club first.
// Run with: npm run db:seed
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
  insert into klubovi (naziv, adresa, telefon)
  values ($1, 'Primer ulica 1, Beograd', '+381110000000')
  returning id
),
vlasnik as (
  insert into vlasnici (klub_id, ime, email, uloga)
  select id, 'Vlasnik Primer', 'vlasnik@primer.rs', 'vlasnik' from klub
),
teren as (
  insert into tereni (klub_id, naziv, vrsta)
  select id, v.naziv, v.vrsta::vrsta_terena
  from klub, (values ('Teren 1', 'zatvoren'), ('Teren 2', 'otvoren')) as v(naziv, vrsta)
  returning id
),
radno as (
  insert into radno_vreme (teren_id, dan, otvara, zatvara)
  select teren.id, d, '08:00', '23:00' from teren, generate_series(1, 7) as d
)
insert into igraci (klub_id, ime, telefon)
select klub.id, v.ime, v.telefon
from klub, (values
  ('Nikola', '+381641111111'),
  ('Jelena', '+381642222222'),
  ('Stefan', '+381643333333'),
  ('Marko',  '+381644444444'),
  ('Ana',    '+381645555555')
) as v(ime, telefon);

insert into rezervacije (teren_id, igrac_id, pocetak, kraj, cena_rsd, status, izvor)
select t.id, i.id, v.pocetak::timestamptz, v.kraj::timestamptz, 4800, v.status::status_rezervacije, v.izvor::izvor_rezervacije
from (values
  ('Teren 1', 'Nikola', '2026-10-24 17:00 Europe/Belgrade', '2026-10-24 18:30 Europe/Belgrade', 'potvrdjena', 'telefon'),
  ('Teren 2', 'Jelena', '2026-10-24 17:30 Europe/Belgrade', '2026-10-24 19:00 Europe/Belgrade', 'potvrdjena', 'online'),
  ('Teren 1', 'Stefan', '2026-10-24 20:30 Europe/Belgrade', '2026-10-24 22:00 Europe/Belgrade', 'potvrdjena', 'telefon'),
  ('Teren 2', 'Marko',  '2026-10-24 19:00 Europe/Belgrade', '2026-10-24 20:30 Europe/Belgrade', 'potvrdjena', 'online'),
  ('Teren 2', 'Marko',  '2026-10-10 19:00 Europe/Belgrade', '2026-10-10 20:30 Europe/Belgrade', 'nedolazak',  'telefon')
) as v(teren, igrac, pocetak, kraj, status, izvor)
join klubovi k on k.naziv = $1
join tereni t on t.klub_id = k.id and t.naziv = v.teren
join igraci i on i.klub_id = k.id and i.ime = v.igrac;

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
