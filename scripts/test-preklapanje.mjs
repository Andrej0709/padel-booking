// Proves the database itself refuses overlapping bookings on the same court.
// Everything runs inside a transaction that is rolled back, so no data changes.
// Each case first books Nikola on Teren 1, 17:00-18:30 on a fixed future Saturday,
// so the test does not depend on what the example data contains that day.
// Run with: npm run db:test-preklapanje (after npm run db:seed)
import pg from "pg";

process.loadEnvFile(".env.local");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });

const insert = `
  insert into rezervacije (teren_id, igrac_id, pocetak, kraj, status, izvor)
  select t.id, i.id, $1::timestamptz, $2::timestamptz, $3::status_rezervacije, 'online'
  from klubovi k
  join tereni t on t.klub_id = k.id and t.naziv = 'Teren 1'
  join igraci i on i.klub_id = k.id and i.ime = $4
  where k.naziv = 'Padel Centar (primer)'`;

const NIKOLA = { od: "2030-01-05 17:00 Europe/Belgrade", do: "2030-01-05 18:30 Europe/Belgrade" };

const cases = [
  {
    opis: "Ana: Teren 1, sub 18:00-19:30 (Nikola igra 17:00-18:30)",
    od: "2030-01-05 18:00 Europe/Belgrade", do: "2030-01-05 19:30 Europe/Belgrade", status: "potvrdjena",
    ocekivano: "odbijeno",
  },
  {
    opis: "Ana: Teren 1, sub 18:30-20:00 (počinje tačno kad Nikola završi)",
    od: "2030-01-05 18:30 Europe/Belgrade", do: "2030-01-05 20:00 Europe/Belgrade", status: "potvrdjena",
    ocekivano: "upisano",
  },
  {
    opis: "Ana: Teren 1, sub 17:00-18:30, ali otkazana (otkazane ne drže teren)",
    od: "2030-01-05 17:00 Europe/Belgrade", do: "2030-01-05 18:30 Europe/Belgrade", status: "otkazana",
    ocekivano: "upisano",
  },
];

await client.connect();
let failed = 0;
try {
  for (const c of cases) {
    await client.query("begin");
    let rezultat;
    try {
      await client.query(insert, [NIKOLA.od, NIKOLA.do, "potvrdjena", "Nikola"]);
      const res = await client.query(insert, [c.od, c.do, c.status, "Ana"]);
      rezultat = res.rowCount === 1 ? "upisano" : "nije pronađen primer klub";
    } catch (error) {
      rezultat = error.code === "23P01" ? "odbijeno" : `greška: ${error.message}`;
    } finally {
      await client.query("rollback");
    }
    const ok = rezultat === c.ocekivano;
    if (!ok) failed++;
    console.log(`${ok ? "OK  " : "FAIL"} ${c.opis} -> ${rezultat}`);
  }
} finally {
  await client.end();
}
process.exit(failed ? 1 : 0);
