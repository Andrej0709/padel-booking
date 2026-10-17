// Sets the password of the test accounts to TEST_LOZINKA from .env.local.
// The password lives only in .env.local (never on GitHub, which is public). See decision 012.
// If TEST_LOZINKA is missing, a random one is created and saved to .env.local.
// Run with: npm run db:test-lozinke
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import pg from "pg";
import { hashPassword } from "better-auth/crypto";

const TEST_NALOZI = ["vlasnik@primer.rs", "igrac@primer.rs"];

process.loadEnvFile(".env.local");
let lozinka = process.env.TEST_LOZINKA;
if (!lozinka) {
  lozinka = randomBytes(12).toString("base64url");
  const kraj = readFileSync(".env.local", "utf8").endsWith("\n") ? "" : "\n";
  appendFileSync(".env.local", `${kraj}# Password of the local test accounts (scripts/test-lozinke.mjs)\nTEST_LOZINKA=${lozinka}\n`);
  console.log("Nova lozinka je upisana u .env.local kao TEST_LOZINKA.");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await client.connect();
try {
  const hash = await hashPassword(lozinka);
  const { rows } = await client.query(
    `update nacini_prijave n set lozinka = $1, azurirano = now()
     from korisnici k
     where k.id = n.korisnik_id and n.nacin = 'credential' and k.email = any($2)
     returning k.email`,
    [hash, TEST_NALOZI],
  );
  // Log out everywhere, so a session opened with the old password stops working too.
  await client.query(
    `delete from sesije s using korisnici k where k.id = s.korisnik_id and k.email = any($1)`,
    [TEST_NALOZI],
  );
  console.log("Lozinka promenjena za:", rows.map((r) => r.email).join(", ") || "nijedan nalog (napravi ih na /registracija)");
} finally {
  await client.end();
}
