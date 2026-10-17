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

## 008. Ceo sajt odjednom ili stranica po stranicu

Datum: 2026-10-17

Problem: Iz Claude Designa postoji dizajn za ceo proizvod (raspored, upis, detalji, profil igrača, online rezervacija), a radi samo jedan ekran. Treba odlučiti da li se sada prave sve stranice ili jedna po jedna.

Opcije:
- A) Ceo sajt odjednom, sve stvarno radi (vlasnik: prijava, raspored, igrači, podešavanja; igrač: stranica kluba, online rezervacija). Prednost: vidi se ceo proizvod i može se pokazati vlasnicima. Mana: neke stranice traže odluke koje još nisu donete.
- B) Ceo sajt kao skelet: sve stranice u konačnom izgledu, ali neodlučeni delovi prikazuju primer podatke i oznaku "nacrt". Prednost: najbrže se vidi celina. Mana: lako je pomešati "izgleda gotovo" sa "jeste gotovo".
- C) Stranica po stranicu, svaka sa odlukom pre gradnje. Prednost: sve što postoji zaista radi. Mana: dugo se ne vidi celina.

Korisnik je predložio: A. Tako je pravio i Adronis: prvo ceo sajt, pa nadogradnja. Kad se vidi ceo proizvod, lakše je odlučivati i lakše je pokazati ga drugima.

Claude je izabrao: A, uz dva uslova. Claude je ranije predlagao C, ali je korisnikov argument jači: celina se lakše procenjuje i lakše pokazuje vlasnicima klubova.
- Uslov 1: pre gradnje se donose tri odluke koje sajt traži (prijava vlasnika, potvrda igrača kod online rezervacije, cenovnik). U sistemu za rezervacije sve stranice pišu u istu tabelu, pa loše zamišljena stranica kvari podatke svima. Zato se te odluke ne donose potajno u kodu.
- Uslov 2: sajt ostaje samo na korisnikovom računaru dok prijava vlasnika i potvrda igrača ne prorade. Bez prijave bi svako video imena i brojeve telefona igrača.

Šta bi promenilo odluku:
- Ako sajt treba pokazati vlasnicima pre nego što se tri odluke donesu. Tada B (skelet sa oznakom "nacrt").
- Ako razgovori sa vlasnicima pokažu da online rezervacije nikome ne trebaju. Tada se deo za igrače odlaže.

## 009. Prijava vlasnika

Datum: 2026-10-17

Problem: Deo za vlasnika prikazuje imena i brojeve telefona igrača, pa ga smeju videti samo ljudi iz kluba. Posle prijave sajt pamti osobu (sesija), da ne pita stalno.

Opcije:
- A) Email i lozinka. Prednost: svi znaju kako radi. Mana: lozinke se zaboravljaju, pa treba "zaboravljena lozinka" preko emaila; recepcioneri često dele jednu lozinku.
- B) Link na email, bez lozinke. Prednost: nema lozinke koja se zaboravi ili ukrade. Mana: svaki ulaz na novom uređaju traži otvaranje emaila.
- C) Prijava preko Google naloga. Prednost: jedan klik, bezbednost brine Google. Mana: ne mora svako imati Google nalog; zavisnost od Google-a.

Korisnik je predložio: A. Najlakše i najbezbednije.

Claude je izabrao: A.
- Slaže se da je najlakše: niko ne mora ništa da uči.
- Ne slaže se potpuno da je najbezbednije. Lozinka je obično najslabija tačka (ista lozinka na više sajtova, papirić na recepciji). B je po tome bezbedniji. Razlika je ovde mala, ako se poštuju dva pravila ispod.
- Pravila: svaki recepcioner ima svoj nalog (nema deljenja lozinke), a vlasnik može da doda ili ukloni recepcionera. Koristi se gotov, proveren alat za prijavu, ne pišemo svoj. Lozinke se nikad ne čuvaju u čitljivom obliku.
- "Zaboravljena lozinka" traži slanje emaila, pa nam treba servis za slanje emaila.
- Klub i prvog vlasnika za sada pravimo ručno. Samostalna registracija kluba dolazi kasnije.

Šta bi promenilo odluku:
- Ako se pokaže da recepcioneri ipak dele lozinke. Tada dodajemo B ili C.
- Ako vlasnici traže ulaz jednim klikom. Tada dodajemo C (Google) pored A.

Dopuna (2026-10-17): korisnik je odmah tražio i Google prijavu za vlasnika, isto kao za igrače (Odluka 010). Vlasnik bira: email i lozinka ili Google. Claude se slaže: to je bio uslov iz "Šta bi promenilo odluku", a isti alat pokriva oba načina, pa je dodatni posao mali. Pravilo: Google prijava ne pravi novog vlasnika. U deo za vlasnika ulazi samo email koji je vlasnik kluba prethodno dodao, bez obzira na način prijave.

## 011. Cenovnik

Datum: 2026-10-17

Problem: Cenu sada vlasnik kuca ručno. Online igrač mora da vidi cenu pre rezervacije.

Opcije:
- A) Jedna cena po satu za ceo klub (npr. 3.200 din/sat, 90 minuta = 4.800). Prednost: najjednostavnije. Mana: mnogi klubovi uveče i vikendom naplaćuju skuplje.
- B) Cena po dobu dana i danu u nedelji. Prednost: odgovara tome kako klubovi naplaćuju. Mana: složenije podešavanje i pravilo za termin koji prelazi iz jedne cene u drugu.
- C) Kao B, ali i po terenu. Prednost: najveća sloboda. Mana: najviše podešavanja, možda nikome ne treba.

Korisnik je predložio: A.

Claude je izabrao: A, kao početak.
- Još nismo razgovarali ni sa jednim vlasnikom, pa ne znamo kako tačno naplaćuju. Ne pravimo složen cenovnik na pretpostavci.
- Prelazak na B kasnije je mali posao, jer se cena već pamti na svakoj rezervaciji. Stari termini se ne menjaju kad se cenovnik promeni.
- Vlasnik uvek može ručno da promeni cenu pojedinačne rezervacije (popust, stalni igrač).

Šta bi promenilo odluku:
- Ako prvi klub kaže da ima različite cene uveče ili vikendom. Tada odmah prelazimo na B, jer bi online igrač inače video pogrešnu cenu.

## 010. Kako znamo da je igrač pravi kad rezerviše online

Datum: 2026-10-17

Problem: Po Odluci 006 igrač rezerviše samo sa imenom i brojem telefona, bez naloga. Neko može da upiše tuđi broj ili da iz šale zauzme ceo raspored. Telefonom se to ne dešava, jer vlasnik čuje osobu.

Opcije:
- A) SMS kod pre svake online rezervacije. Prednost: broj je proveren. Mana: svaka poruka košta. Twilio za Srbiju navodi oko $0,41 po poruci; domaći servisi nisu provereni.
- B) Vlasnik potvrđuje svaku online rezervaciju. Prednost: besplatno i sigurno. Mana: igrač ne dobija potvrdu odmah, vlasnik ima posao više.
- C) Bez provere, uz pravila (ograničen broj budućih rezervacija, zabrana posle nedolazaka). Prednost: besplatno i trenutno. Mana: tuđi ili izmišljen broj prolazi.

Korisnik je predložio: novu opciju. Za online rezervaciju igrač mora da ima nalog i da se prijavi kad prvi put uđe, kao u aplikaciji koju je korisnik isprobao. Prijava emailom i lozinkom ili preko Google-a.

Claude je izabrao: korisnikovu opciju, sa dopunama.
- Nalog rešava veći deo problema: igrač nije anoniman, klub može da blokira nalog, igrač sam vidi i otkazuje svoje termine.
- Telefonske rezervacije ostaju bez naloga, kao u Odluci 006.
- Zamka: broj telefona upisan u nalog niko ne proverava. Kad bi se nalog sam spojio sa istorijom tog broja, neko bi napravio nalog sa tuđim brojem i video tuđe termine. Zato važi pravilo: nalog vidi samo rezervacije koje je sam napravio online. Vlasnik i dalje vidi sve rezervacije jednog broja zajedno.
- Pravila protiv zloupotrebe: najviše 2 buduće rezervacije po nalogu u jednom klubu; posle 2 nedolaska nalog ne može da rezerviše online u tom klubu; vlasnik može da blokira nalog.
- Google ne daje broj telefona, pa igrač upisuje ime i broj pri prvoj rezervaciji.
- Isti alat za prijavu služi i vlasnicima i igračima (Odluka 009).

Ovo menja Odluku 006 samo za online rezervacije: online igrač ima nalog, telefonski i dalje nema.

Šta bi promenilo odluku:
- Ako se pojave lažne rezervacije sa izmišljenim brojevima. Tada dodajemo SMS proveru broja jednom, pri registraciji.
- Ako se nađe domaći SMS servis po ceni od par dinara. Tada isto dodajemo SMS proveru.
- Ako mnogo igrača odustane kad vidi da mora da napravi nalog. Tada razmatramo rezervaciju bez naloga uz potvrdu vlasnika (opcija B).

## 012. Jedna baza za računar i sajt na internetu

Datum: 2026-10-17

Problem: Sajt ide na Vercel. Treba odlučiti da li sajt na internetu i korisnikov računar koriste istu bazu. Na računaru se testira: lažne rezervacije, test igrači i test nalozi.

Opcije:
- A) Ista baza (Neon grana "production"). Prednost: najjednostavnije, ništa dodatno se ne podešava. Mana: testovi sa računara se vide na pravom sajtu, a test nalozi rade i na internetu.
- B) Odvojene baze (posebna Neon grana za računar). Prednost: pravi sajt ostaje čist, testira se slobodno. Mana: jedno podešavanje više, a promene tabela se primenjuju na obe grane.

Korisnik je predložio: A. Najjednostavnije, test nalozi ne moraju da se brišu, a niko neće pristupiti sajtu.

Claude je izabrao: A, uz promenu lozinki test naloga.
- Slaže se da je jedna baza dovoljna dok na sajtu nema pravih klubova ni pravih igrača.
- Ne slaže se sa "niko neće pristupiti". GitHub repozitorijum je javan, a lozinka test naloga je stajala u `scripts/seed.mjs`. Svako ko pročita fajl mogao bi da uđe u deo za vlasnika na pravom sajtu. Provera "niko neće" ne postoji, a ispravka je jeftina.
- Zato test nalozi ostaju, ali dobijaju novu nasumičnu lozinku koja stoji samo u `.env.local` (TEST_LOZINKA), nikad na GitHubu. Stara lozinka iz istorije repozitorijuma više ništa ne otvara.

Šta bi promenilo odluku:
- Kad dođe prvi pravi klub. Tada prelazimo na B, da se test podaci ne mešaju sa pravim rezervacijama i ličnim podacima.
