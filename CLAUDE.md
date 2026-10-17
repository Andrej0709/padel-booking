# Booking projekat

## O projektu

Sistem za online zakazivanje termina za lokalne biznise u Srbiji. Izabrana niša su padel i teniski tereni (vidi Odluku 001 u `ODLUKE.md`). Jezgro sistema se ipak pravi generički, preko pojma "resurs" (teren, a kasnije možda zaposleni ili radno mesto), da bi kasnije moglo da se proširi na druge niše.

## Gde smo stali (2026-10-17)

Urađeno:
- Odluke 001–011 su u `ODLUKE.md` (niša padel, prvo raspored pa online rezervacije, pretplata po aktivnom terenu, Next.js + Vercel + Neon, početak i kraj termina, igrač po broju telefona, raspored kao tabla, ceo sajt odjednom, prijava emailom ili Google-om, obavezan nalog za online rezervaciju, jedna cena po satu).
- Ceo sajt u stilu Claude Design dizajna (boje, slova Barlow, znak, svetla i tamna tema). Dizajn je stigao kao zip i nije deo projekta.
- Igrač: `/k/[slug]` (stranica kluba i online rezervacija), `/moje-rezervacije` (otkazivanje do 12 sati pre), `/prijava`, `/registracija`, `/zaboravljena-lozinka`, `/nova-lozinka`. Početna strana vodi na prvi klub.
- Vlasnik: `/vlasnik` (raspored, tabla), `/vlasnik/igraci` i profil igrača, `/vlasnik/podesavanja` (klub, cena, tereni, radno vreme), `/vlasnik/tim`. Recepcija ne vidi podešavanja i tim.
- Pravila za online (Odluka 010): najviše 2 buduće rezervacije po nalogu u klubu, bez online rezervacije posle 2 nedolaska, vlasnik može da blokira nalog. Nalog vidi samo svoje online rezervacije.
- Sve provereno u browseru (računar i telefon). Test preklapanja prolazi i više ne zavisi od datuma u primer podacima.
- Mapa sistema: `vizuelno/mapa-sistema.html`, objavljena na https://claude.ai/artifact/PnjEQsJaUd6ETn9dbNZNFy
- Kod je na GitHubu: https://github.com/Andrej0709/padel-booking (grana main).

Sledeći korak: nije izabran. Kandidati: Google prijava (korisnik pravi Google Cloud projekat), servis za slanje emaila, objavljivanje na Vercelu, razgovor sa vlasnicima uz gotov sajt.

Otvoreno, za kasnije:
- Sajt ostaje samo lokalno dok prijava ne radi i na internetu (Odluka 008, uslov 2). Za objavljivanje treba: servis za email (sada se linkovi ispisuju u log servera, a u produkciji slanje namerno puca), BETTER_AUTH_SECRET i BETTER_AUTH_URL na Vercelu, Neon integracija.
- Google prijava: dugme postoji, ali radi tek kad se u `.env.local` upišu GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET.
- Podsetnici: proveriti ograničenja Vercel cron-a.
- Cenovnik po dobu dana (Odluka 011, opcija B) ako prvi klub tako naplaćuje.
- SMS provera broja (Odluka 010) ako se pojave lažne rezervacije.
- Samostalna registracija novog kluba. Sada se klub pravi ručno.
- Neon MCP server je instaliran, ali korisnik nije prijavljen (`/mcp` u `claude` terminalu). Nije neophodan.
- Korisnik treba da porazgovara sa vlasnicima klubova: koliko poziva dnevno, koliko nedolazaka, kako vode raspored, kako naplaćuju (cena uveče), šta ih nervira, rade li cele godine.
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
- Prijava: Better Auth 1.7.7 (`src/lib/auth.ts`), tabele `korisnici`, `sesije`, `nacini_prijave`, `verifikacije` u našoj bazi. Imena polja u `schema.ts` su ona koja Better Auth očekuje, a kolone su na srpskom. Telemetrija alata je isključena. Email mora biti potvrđen pre prijave.
- Ko sme šta: `src/lib/pristup.ts` (`zahtevajClana`, `zahtevajVlasnika`). Svaka stranica i svaka server akcija za vlasnika proverava ponovo. Član tima je onaj čiji je email u tabeli `vlasnici`.
- Emailovi (`src/lib/email.ts`) se u razvoju ispisuju u log servera sa oznakom `[EMAIL]`.
- Kod koji radi u browseru ne sme da uvozi `src/lib/raspored.ts` ili `db.ts` (vuku bazu u browser i ruše stranicu). Za datume u browseru služi `src/lib/kalendar.ts`, za prikaz `src/lib/format.ts`.
- `npm run db:dodaj-clana -- email "Ime" vlasnik` daje emailu pristup primer klubu. Test nalozi su opisani na vrhu `scripts/seed.mjs`.
- Ako dev server prijavi `ENOENT ... build-manifest.json`, ugasiti ga, obrisati `.next/dev` i pokrenuti ponovo.

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
