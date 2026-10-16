# Booking projekat

## O projektu

Sistem za online zakazivanje termina za lokalne biznise u Srbiji. Izabrana niša su padel i teniski tereni (vidi Odluku 001 u `ODLUKE.md`). Jezgro sistema se ipak pravi generički, preko pojma "resurs" (teren, a kasnije možda zaposleni ili radno mesto), da bi kasnije moglo da se proširi na druge niše.

## Tehnologija

Vidi Odluku 004 u `ODLUKE.md`.

- Next.js (frontend i server u jednom projektu), hosting na Vercelu.
- Postgres baza na Neonu. Pravilo o nepreklapanju termina mora da bude u samoj bazi, ne samo u kodu servera.
- Pozadinski poslovi (podsetnici) još nisu rešeni. Pre rada na njima proveriti trenutna ograničenja Vercel cron-a.
- Neon projekat je povezan preko `neon.ts`. Podešavanja (DATABASE_URL i DATABASE_URL_UNPOOLED) stižu u `.env.local` komandom `neon deploy` ili `neon env pull`. Taj fajl se nikad ne commit-uje.
- Baza se iz aplikacije koristi preko `src/lib/db.ts` (drajver `pg` i `attachDatabasePool`, kako Neon preporučuje za Vercel). Aplikacija koristi DATABASE_URL (pooled), a migracije DATABASE_URL_UNPOOLED (direct).
- `/api/zdravlje` je probna adresa koja proverava da li aplikacija može da dođe do baze.

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
