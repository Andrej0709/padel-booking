# Booking projekat

## O projektu

Sistem za online zakazivanje termina za lokalne biznise u Srbiji. Izabrana niša su padel i teniski tereni (vidi Odluku 001 u `ODLUKE.md`). Jezgro sistema se ipak pravi generički, preko pojma "resurs" (teren, a kasnije možda zaposleni ili radno mesto), da bi kasnije moglo da se proširi na druge niše.

## Gde smo stali (2026-10-17)

Urađeno:
- Odluke 001–007 su u `ODLUKE.md` (niša padel, prvo raspored za vlasnika pa online rezervacije, mesečna pretplata po aktivnom terenu, Next.js + Vercel + Neon, početak i kraj termina, igrač po broju telefona, raspored kao tabla).
- Next.js aplikacija povezana sa Neon bazom u Frankfurtu. `/api/zdravlje` radi.
- 6 tabela u bazi, pravilo protiv preklapanja termina, primer klub "Padel Centar (primer)". Test preklapanja prolazi.
- Prvi ekran: `/raspored` (početna strana vodi tamo). Tabla svih terena za jedan dan, polja od 30 minuta, klik na prazno polje upisuje rezervaciju primljenu telefonom (90 min podrazumevano), klik na rezervaciju menja status (odigrano, nije došao, otkaži). Nema prijave, prikazuje prvi klub iz baze. Primer rezervacije su u subotu 2026-10-24.
- Mapa sistema: `vizuelno/mapa-sistema.html`, objavljena na https://claude.ai/artifact/PnjEQsJaUd6ETn9dbNZNFy
- Kod je na GitHubu: https://github.com/Andrej0709/padel-booking (grana main).

Sledeći korak: nije izabran. Kandidati: prijava vlasnika (veća odluka), cenovnik po dobu dana, ili online rezervacije za igrače.

Otvoreno, za kasnije:
- Objavljivanje na Vercelu i davanje lozinke baze Vercelu (Neon integracija).
- Prijava vlasnika (auth) još nije izabrana. To je veća odluka i ide kroz proces iz ovog fajla.
- Cenovnik (cena po terminu i dobu dana) još ne postoji kao tabela. Cena se sada samo upisuje na rezervaciju.
- Podsetnici: proveriti ograničenja Vercel cron-a.
- Neon MCP server je instaliran, ali korisnik nije prijavljen (`/mcp` u `claude` terminalu). Nije neophodan.
- Korisnik treba da porazgovara sa vlasnicima klubova: koliko poziva dnevno, koliko nedolazaka, kako vode raspored, šta ih nervira, rade li cele godine.
- U konzoli se pojavljuje upozorenje drajvera `pg` o `sslmode` iz DATABASE_URL. Bezopasno, ali traži odluku pre nadogradnje na `pg` v9.
- Ime brenda nije izabrano. Radni naziv je `padel-booking`.

## Tehnologija

Vidi Odluku 004 u `ODLUKE.md`.

- Next.js (frontend i server u jednom projektu), hosting na Vercelu.
- Postgres baza na Neonu. Pravilo o nepreklapanju termina mora da bude u samoj bazi, ne samo u kodu servera.
- Pozadinski poslovi (podsetnici) još nisu rešeni. Pre rada na njima proveriti trenutna ograničenja Vercel cron-a.
- Neon projekat je povezan preko `neon.ts`. Podešavanja (DATABASE_URL i DATABASE_URL_UNPOOLED) stižu u `.env.local` komandom `neon deploy` ili `neon env pull`. Taj fajl se nikad ne commit-uje.
- Baza se iz aplikacije koristi preko `src/lib/db.ts` (drajver `pg` i `attachDatabasePool`, kako Neon preporučuje za Vercel). Aplikacija koristi DATABASE_URL (pooled), a migracije DATABASE_URL_UNPOOLED (direct).
- `/api/zdravlje` je probna adresa koja proverava da li aplikacija može da dođe do baze.
- Tabele se opisuju u `src/db/schema.ts` (Drizzle). Nazivi tabela i kolona su na srpskom, bez dijakritika, da odgovaraju mapi sistema.
- Promena tabela: izmeni `schema.ts`, pa `npm run db:generate`, pa `npm run db:migrate`. Ono što Drizzle ne ume da opiše (pravilo o nepreklapanju, `EXCLUDE` u `drizzle/0001_bez_preklapanja.sql`) ide u ručnu migraciju (`npm run db:generate -- --custom`).
- `npm run db:seed` ubacuje primer klub "Padel Centar (primer)". `npm run db:test-preklapanje` proverava da baza odbija preklapanje termina.
- Kad se tabele promene, ažurirati i model podataka u `vizuelno/mapa-sistema.html`.

## Dogovor o načinu rada

Korisnik ne programira i ne želi da uči programiranje. Kod piše Claude. Korisnik u ovom projektu želi da nauči dve stvari:

1. Kako AI razmišlja: zašto donosi odluke koje donosi i kako se odlučuje između opcija.
2. Kako sajt radi u pozadini, prikazano vizuelno i praktično, ne kroz kod.

Komunikacija ide na srpskom (latinica), jednostavnim jezikom. Svaki stručni izraz se objasni kad se prvi put pojavi.

### Pre svake veće odluke

1. Opiši problem jednostavnim jezikom.
2. Navedi 2–3 realne opcije, sa prednostima i manama svake.
3. Pre nego što kažeš svoj izbor, pitaj korisnika šta bi izabrao i zašto.
4. Tek onda reci svoj izbor, obrazloženje i šta bi te nateralo da promeniš mišljenje.
5. Upiši odluku u `ODLUKE.md`.

Male, rutinske odluke (nazivi, formatiranje, sitne biblioteke) ne idu kroz ovaj proces, ali se mogu objasniti ako korisnik pita.

### Vizuelno objašnjavanje

- Svaki novi deo sistema dobija vizuelno objašnjenje: dijagram, interaktivnu stranicu ili pokazivanje u alatu (pregled tabela u bazi, Network tab u browseru, logovi servera).
- Mapa sistema se ažurira kako sistem raste.
- Kod se ne pokazuje osim ako ga korisnik ne traži. Objašnjava se šta se dešava, ne kako je napisano.

### Iskrenost

- Kad Claude objašnjava zašto je nešto odlučio, to je rekonstrukcija rezonovanja, a ne direktan uvid u unutrašnji rad modela. Reći to kad je bitno.
- Korisnik treba da dovodi odluke u pitanje. AI ume da pogreši i da pritom zvuči sigurno.
