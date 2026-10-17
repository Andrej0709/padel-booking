// Gives an email access to the example club's owner pages.
// Run with: npm run db:dodaj-clana -- tvoj@email.com "Tvoje Ime" [vlasnik|recepcija]
// Then sign up or log in with that email on /prijava.
import pg from "pg";

process.loadEnvFile(".env.local");
const [email, ime = "Vlasnik", uloga = "vlasnik"] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error('Upotreba: npm run db:dodaj-clana -- email@primer.rs "Ime" vlasnik');
  process.exit(1);
}
if (!["vlasnik", "recepcija"].includes(uloga)) {
  console.error("Uloga mora biti vlasnik ili recepcija.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await client.connect();
try {
  const { rows } = await client.query(
    `insert into vlasnici (klub_id, ime, email, uloga)
     select id, $2, lower($1), $3 from klubovi order by kreirano limit 1
     on conflict (email) do update set ime = excluded.ime, uloga = excluded.uloga
     returning email, uloga`,
    [email, ime, uloga],
  );
  console.log("Dodat u tim:", rows[0]);
} finally {
  await client.end();
}
