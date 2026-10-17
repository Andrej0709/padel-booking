# Dnevnik odluka

Ovde se beleži svaka veća odluka u projektu: šta je bio problem, koje su bile opcije, šta je izabrano i zašto. Cilj je da se uvek može videti zašto je sistem napravljen baš ovako, i da se vidi kako AI razmišlja kad bira.

Kolona "Šta bi promenilo odluku" je najvažnija. Dobra odluka uvek zna pod kojim uslovima bi bila pogrešna.

## Šablon

```
## [broj]. [Naslov odluke]
Datum:
Problem: (jednostavnim rečima, šta pokušavamo da rešimo)
Opcije:
  A) ... prednosti / mane
  B) ... prednosti / mane
Korisnik je predložio: ... i zašto
Claude je izabrao: ... i zašto
Šta bi promenilo odluku:
```

---

<!-- Odluke idu ispod ove linije, najnovija na dnu. -->

## 001. Niša: padel i teniski tereni

Datum: 2026-10-16

Problem: Treba izabrati za koga pravimo sistem. Niša određuje šta se zakazuje (osoba ili stvar), koliko termin traje, da li se plaća unapred i ko zakazuje.

Opcije:
- A) Frizeri i saloni lepote. Prednost: ogroman broj firmi. Mana: već postoje SrediMe, Salona i Fresha, a termini zavise od rasporeda zaposlenih, što je složenije.
- B) Padel i teniski tereni. Prednost: skupi termini, sport raste, termin je fiksan (po satu), pa je model podataka jednostavan. Mana: firmi ima relativno malo, a Playtomic je jak globalni igrač.
- C) Auto servisi i vulkanizeri. Prednost: skoro nikakva konkurencija. Mana: trajanje posla je teško predvideti, pa je zakazivanje nezgodno.

Korisnik je predložio: B. Termini su skupi, pa klubovi imaju novca za ovakav alat. Mnogo ljudi igra, pa bi broj korisnika mogao biti veliki.

Claude je izabrao: B, ali iz delimično drugih razloga.
- Tehnički je najčistija niša. Resurs je teren, termini su fiksni blokovi, nema rasporeda zaposlenih. Možemo da se fokusiramo na suštinu sistema.
- Problem je jasan i lako se meri: prazan termin je izgubljen novac, a termin na koji niko ne dođe takođe.
- Ima zanimljive funkcije koje frizeri nemaju: deljenje plaćanja na 4 igrača, traženje četvrtog igrača, stalni nedeljni termini.
- Klubovi su fizički dostupni. Može se otići na termin i porazgovarati sa vlasnikom.

Napomene uz korisnikovo rezonovanje:
- "Imaju novca" ne znači "žele da plate". Prodajni argument je koliko ih košta prazan termin, a ne koliko imaju para.
- Igrači su korisnici, ali klubovi su kupci (oni plaćaju). Igrača ima mnogo, a klubova u Srbiji verovatno nekoliko desetina, ne hiljade. Tačan broj nismo uspeli da proverimo.

Šta bi promenilo odluku:
- Ako se ispostavi da većina klubova u Srbiji već koristi Playtomic i zadovoljna je.
- Ako posle razgovora sa 3 kluba nijedan nema problem sa načinom na koji sada prima rezervacije.

Provera (2026-10-16): korisnik je pretražio Playtomic i u okolini korisnika nema nijednog kluba. Ovo može da znači dve stvari: klubovi postoje, ali rezervacije primaju telefonom ili preko Instagrama (prilika), ili klubova u okolini ima malo (malo tržište). Sledeći korak je da se proveri koliko padel klubova postoji u okolini i kako sada primaju rezervacije.

Provera (2026-10-17): korisnik je na Google Mapama našao mnogo padel klubova u okolini, a većina rezervacije prima telefonom. Ovo potvrđuje tumačenje "prilika": tržište postoji i nije pokriveno online rešenjem. Još nije provereno da li klubovima telefonske rezervacije stvarno smetaju. To se saznaje samo razgovorom sa vlasnicima.

## 002. Šta pravimo prvo

Datum: 2026-10-17

Problem: Prva verzija treba da reši jedan problem dobro. Treba izabrati od čega počinjemo.

Opcije:
- A) Online rezervacije za igrače. Prednost: odmah se vidi korist, jer ima manje poziva. Mana: igrači moraju da promene naviku, a mnogi će i dalje zvati.
- B) Digitalni raspored za vlasnika. Vlasnik i dalje prima pozive, ali termine upisuje u aplikaciju. Prednost: niko osim vlasnika ne menja naviku. Mana: igrači ne vide razliku.
- C) Viber bot za rezervacije. Prednost: svi već koriste Viber. Mana: tehnički najsloženije, i zavisimo od Vibera.

Korisnik je predložio: A. Razlog nije naveden.

Claude je izabrao: prvo B, pa odmah A na njemu. Prvi klub dobija oba.
- A ne može da radi bez B. Ako igrači rezervišu online, a vlasnik i dalje prima pozive i piše u svesku, sistem ne zna za termine iz sveske. Online igrač i igrač sa telefona dobiju isti teren. To je situacija 3 sa mape sistema, samo između aplikacije i sveske.
- Zato sve rezervacije, i telefonske i online, moraju da budu na jednom mestu. B je to mesto, a A je samo još jedna vrata kroz koja rezervacije ulaze.
- B je tehnički jednostavniji i daje temelj (tereni, termini, pravilo o preklapanju) na kom se A gradi bez dupliranja posla.

Šta bi promenilo odluku:
- Ako klub već ima digitalni raspored (Excel, Google Calendar) koji ne želi da menja. Onda bi A morao da se poveže sa tim rasporedom.
- Ako vlasnici kažu da ih telefon ne smeta, ali im smeta što igrači ne dolaze. Onda bi prvo išli podsetnici i kapara.

Korisnik se složio sa B i A zajedno.

## 003. Model zarade

Datum: 2026-10-17

Problem: Kako sistem zarađuje i ko plaća. Plaća klub (kupac), a ne igrači (korisnici).

Opcije:
- A) Mesečna pretplata. Prednost: predvidiva zarada i predvidiv trošak za klub. Mana: klub plaća i u mrtvoj sezoni.
- B) Provizija po rezervaciji. Prednost: klub plaća samo kad ima koristi. Mana: klub ima motiv da rezervacije prima telefonom, mimo sistema.
- C) Besplatna osnova i plaćeni dodaci. Prednost: lako se proba. Mana: mnogi nikad ne pređu na plaćeno.

Korisnik je predložio: A. Model je najčešći i ljudi su navikli na njega. Mrtvu sezonu bi trebalo nekako rešiti, ali konkretna ideja još ne postoji.

Claude je izabrao: A, uz cenu po aktivnom terenu.
- Pretplata ne kažnjava klub što koristi sistem. Kod provizije svaka rezervacija preko telefona je ušteda za klub, pa bi sistem radio protiv sebe.
- Cena se računa po terenu koji je tog meseca otvoren. Otvoreni tereni koji zimi ne rade se tog meseca ne naplaćuju, automatski, bez pregovora. Tako se mrtva sezona rešava bez posebnih pravila.
- Uz to godišnja pretplata sa popustom (na primer 12 meseci po ceni 10), za klubove koji rade cele godine.

Napomena uz korisnikovo rezonovanje: "svi su navikli" je tačno i pomaže pri prodaji, ali nije glavni razlog. Glavni razlog je da pretplata ne daje klubu motiv da zaobilazi sistem.

Šta bi promenilo odluku:
- Ako vlasnici kažu da ne žele još jedan mesečni trošak, a prihvatili bi mali iznos po rezervaciji.
- Ako se ispostavi da su skoro svi klubovi zatvoreni i rade cele godine. Tada je cena po aktivnom terenu nepotrebna komplikacija i dovoljna je obična cena po terenu.

## 004. Tehnologija

Datum: 2026-10-17

Problem: Od čega pravimo sistem i gde će raditi.

Nije bilo predmet izbora: baza je Postgres u svim opcijama, jer ima ugrađeno pravilo koje sprečava preklapanje termina i kad stigne mnogo zahteva u istoj sekundi.

Opcije:
- A) Sve u jednoj kutiji: Next.js na Vercelu. Prednost: najbrže, ogromna zajednica, AI ga dobro piše. Mana: delovi sistema su spojeni, a pozadinski radnik traži poseban servis.
- B) Odvojeni delovi (frontend, server, radnik), hosting na Railway-u ili sličnom. Prednost: svaki deo se vidi posebno. Mana: više podešavanja i više delova koji mogu da se pokvare.
- C) Gotova platforma (Supabase). Prednost: najbrži start, prijava korisnika gotova. Mana: zavisnost od jedne firme, deo logike je sakriven.

Korisnik je predložio: A. Hosting planira na Vercelu, sistem nije toliko složen da mu treba komplikovana arhitektura, Claude dobro piše Next.js, a Adronis je (verovatno) napravljen na istoj tehnologiji i hostuje se na Vercelu.

Claude je izabrao: A.
- Korisnikova procena je tačna: najteži deo sistema (sprečavanje duplih rezervacija) živi u bazi, ne u arhitekturi. Za ovu veličinu sistema odvojeni delovi donose posao, a ne korist.
- Ista tehnologija kao Adronis znači da se znanje prenosi iz jednog projekta u drugi.
- Baza: Postgres na Neonu. Povezuje se sa Vercelom u par klikova, ima besplatan plan, i ima pregled tabela u browseru, pa se podaci mogu gledati uživo.
- Gubitak na vidljivosti delova se nadoknađuje mapom sistema, logovima na Vercelu i pregledom tabela na Neonu.

Otvoreno pitanje: pozadinski radnik za podsetnike. Vercel ima zakazane zadatke (cron), ali besplatan plan ih, koliko Claude zna, ograničava na otprilike jednom dnevno. To može biti zastarela informacija i proverava se pre nego što počne rad na podsetnicima. Ako je ograničenje i dalje tu, rešenja su plaćeni Vercel plan ili poseban servis za zakazane poslove.

Šta bi promenilo odluku:
- Ako sistem preraste u nešto sa mnogo pozadinskih poslova (online plaćanja, mnogo poruka, sinhronizacija sa drugim sistemima). Tada bi odvojen radnik (opcija B) postao isplativ.
- Ako troškovi Vercela porastu više od alternativa kad bude mnogo klubova.

## 005. Kako se čuva vreme termina

Datum: 2026-10-17

Problem: Rezervacija mora da zna kada je termin. Pitanje je da li se to čuva kao unapred napravljen blok ili kao početak i kraj.

Opcije:
- A) Fiksni blokovi (08:00, 09:30, 11:00...). Prednost: jednostavno. Mana: termini različite dužine ili pomeren početak ruše sistem.
- B) Početak i kraj. Prednost: fleksibilno, svaki klub radi kako hoće. Mana: računanje slobodnih termina je složenije.

Korisnik je predložio: B. Termini se plaćaju po satu, pa početak i kraj daju i cenu.

Claude je izabrao: B.
- Korisnikov razlog o ceni je dobar i nije bio među navedenim prednostima. Cena može da zavisi i od doba dana (skuplje uveče), što se sa početkom i krajem lako računa.
- Postgres ima ugrađen način da proveri da li se dva vremenska raspona (od–do) preklapaju i da to zabrani. To radi direktno sa početkom i krajem.
- Složenije računanje slobodnih termina je posao za kod, ne za bazu, i rešava se jednom.

Šta bi promenilo odluku:
- Ako se ispostavi da svi klubovi rade isključivo u fiksnim blokovima i nikad ih ne menjaju. Ni tada se model ne menja, samo se prikaz pojednostavljuje.

## 006. Šta je igrač u bazi

Datum: 2026-10-17

Problem: Većina rezervacija dolazi telefonom, a igrač koji zove nema nalog. Treba odlučiti kako se igrač pamti.

Opcije:
- A) Obavezan nalog (email i lozinka). Prednost: tačno se zna ko je ko. Mana: ne radi za telefonske rezervacije, igrači ne vole registraciju.
- B) Samo ime i telefon na rezervaciji. Prednost: najjednostavnije. Mana: isti igrač je mnogo odvojenih zapisa, nema istorije.
- C) Igrač se prepoznaje po broju telefona, nalog nije obavezan. Prednost: radi i za pozive i za online, pamti istoriju. Mana: malo složenije, promena broja pravi "novog" igrača.

Korisnik je predložio: C. Igrači se pamte, a ne moraju da prolaze kroz dugu registraciju.

Claude je izabrao: C.
- Najveći gubitak za klub je kad igrač ne dođe. Da bi se to rešilo, treba znati ko ne dolazi, a to zahteva istoriju po igraču. Samo C to daje.
- Zato rezervacija dobija polje "status" (potvrđena, odigrana, nedolazak, otkazana). Sa C se iz tog polja vidi "ovaj igrač nije došao 3 puta", pa klub može da traži kaparu samo od nepouzdanih igrača.
- Igrači se vode po klubu, ne zajednički za sve klubove. Igrač koji igra u dva kluba postoji dva puta, jednom u svakom. Tako jedan klub ne vidi podatke drugog kluba.
- Broj telefona se uvek čuva u istom obliku (+381...), da bi "064 123 4567" i "+381641234567" bili isti igrač.
- Broj telefona je lični podatak. Čuva se samo ono što sistemu treba.

Šta bi promenilo odluku:
- Ako klubovi žele zajedničku "crnu listu" igrača koji ne dolaze. To bi tražilo zajedničke igrače i pažljivu proveru propisa o zaštiti podataka.

## 007. Izgled rasporeda za vlasnika

Datum: 2026-10-17

Problem: Prvi pravi ekran je dnevni raspored terena. Vlasnik na njemu treba da vidi ko je zauzeo koji termin i da brzo upiše rezervaciju dok igrač čeka na telefonu. Treba izabrati kako ekran izgleda.

Opcije:
- A) Tabla: tereni su kolone, vreme ide odozgo nadole, rezervacije su obojeni blokovi. Klik na prazno polje otvara upis. Prednost: ceo dan svih terena na jednom pogledu, liči na papirni raspored. Mana: na uskom ekranu telefona sa mnogo terena postaje tesno.
- B) Lista po terenu: za svaki teren spisak termina i slobodnih rupa. Prednost: odlično radi na telefonu. Mana: za pitanje "ima li nešto slobodno u 19h?" treba pregledati više lista.
- C) Brzi unos: obrazac na vrhu (ko, kad, koliko dugo), sistem sam nađe slobodan teren, ispod je kratak spisak. Prednost: najbrže dok igrač čeka na vezi. Mana: vlasnik ne vidi celu sliku dana.

Korisnik je predložio: A. Vizuelno najlepše i najpreglednije, i za vlasnika i za igrača.

Claude je izabrao: A.
- Najčešće pitanje na telefonu je "imate li nešto u 19h?". Na tabli se odgovor vidi jednim pogledom preko svih terena, bez traženja.
- Tabla direktno pokazuje i rupe između termina (npr. 30 minuta koji niko ne može da iskoristi). To je izgubljen novac koji se u listi ne primećuje.
- Klubovi koji vode raspored na papiru ili tabli na zidu već razmišljaju u ovom obliku, pa nema učenja.
- Napomena uz korisnikovo rezonovanje: ovaj ekran je samo za vlasnika. Igrač kasnije dobija svoj ekran za online rezervacije. On može da liči na tablu, ali ne sme da pokazuje imena i brojeve drugih igrača, samo "slobodno" i "zauzeto".

Male odluke uz ovu (bez posebnog procesa):
- Ekran za sada nema prijavu i prikazuje primer klub. Radi samo na računaru korisnika, dok se ne izabere prijava vlasnika.
- Tabla je podeljena na polja od 30 minuta. Podrazumevana dužina termina je 90 minuta, uz izbor 60 i 120.

Šta bi promenilo odluku:
- Ako vlasnici raspored vode uglavnom na telefonu, a imaju 6 i više terena. Tada tabla postaje tesna i telefon bi dobio prikaz u obliku liste (B), a računar zadržao tablu.
- Ako se pokaže da vlasnik skoro nikad ne gleda raspored, nego samo upisuje pozive. Tada bi brzi unos (C) postao glavni deo ekrana.
