import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// Table and column names are in Serbian so they match the system map and the Neon table view.
// See ODLUKE.md for why the model looks like this (decisions 005 and 006).

const kreirano = () => timestamp("kreirano", { withTimezone: true }).notNull().defaultNow();

export const ulogaEnum = pgEnum("uloga", ["vlasnik", "recepcija"]);
export const vrstaTerenaEnum = pgEnum("vrsta_terena", ["zatvoren", "otvoren"]);
export const statusRezervacijeEnum = pgEnum("status_rezervacije", [
  "potvrdjena",
  "odigrana",
  "nedolazak",
  "otkazana",
]);
export const izvorRezervacijeEnum = pgEnum("izvor_rezervacije", ["telefon", "online"]);

export const klubovi = pgTable("klubovi", {
  id: uuid("id").primaryKey().defaultRandom(),
  naziv: text("naziv").notNull(),
  // Short name in the club web address: /k/padel-centar
  slug: text("slug").notNull().unique(),
  adresa: text("adresa"),
  telefon: text("telefon"),
  vremenskaZona: text("vremenska_zona").notNull().default("Europe/Belgrade"),
  // One price per hour for the whole club. See decision 011.
  cenaPoSatuRsd: integer("cena_po_satu_rsd"),
  // Shown on the club page for players (decision 013).
  opis: text("opis"),
  // Keys from POGODNOSTI in src/lib/pogodnosti.ts, for example "parking" or "tus".
  pogodnosti: text("pogodnosti").array().notNull().default(sql`'{}'::text[]`),
  kreirano: kreirano(),
});

export const vlasnici = pgTable("vlasnici", {
  id: uuid("id").primaryKey().defaultRandom(),
  klubId: uuid("klub_id")
    .notNull()
    .references(() => klubovi.id, { onDelete: "cascade" }),
  ime: text("ime").notNull(),
  email: text("email").notNull().unique(),
  uloga: ulogaEnum("uloga").notNull().default("recepcija"),
  kreirano: kreirano(),
});

export const tereni = pgTable(
  "tereni",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    klubId: uuid("klub_id")
      .notNull()
      .references(() => klubovi.id, { onDelete: "cascade" }),
    naziv: text("naziv").notNull(),
    vrsta: vrstaTerenaEnum("vrsta").notNull(),
    // Inactive courts (closed for the season) are not billed. See decision 003.
    aktivan: boolean("aktivan").notNull().default(true),
    kreirano: kreirano(),
  },
  (t) => [unique("tereni_klub_naziv_unique").on(t.klubId, t.naziv)],
);

export const radnoVreme = pgTable(
  "radno_vreme",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    terenId: uuid("teren_id")
      .notNull()
      .references(() => tereni.id, { onDelete: "cascade" }),
    // 1 = Monday ... 7 = Sunday (ISO weekday).
    dan: smallint("dan").notNull(),
    otvara: time("otvara").notNull(),
    zatvara: time("zatvara").notNull(),
  },
  (t) => [
    check("radno_vreme_dan_check", sql`${t.dan} between 1 and 7`),
    check("radno_vreme_otvara_pre_zatvara", sql`${t.otvara} < ${t.zatvara}`),
    index("radno_vreme_teren_dan_idx").on(t.terenId, t.dan),
  ],
);

export const igraci = pgTable(
  "igraci",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    klubId: uuid("klub_id")
      .notNull()
      .references(() => klubovi.id, { onDelete: "cascade" }),
    ime: text("ime").notNull(),
    // Always stored as +381..., so the same number written two ways is one player. See decision 006.
    telefon: text("telefon").notNull(),
    kreirano: kreirano(),
  },
  (t) => [
    unique("igraci_klub_telefon_unique").on(t.klubId, t.telefon),
    check("igraci_telefon_format", sql`${t.telefon} ~ '^\\+[0-9]{8,15}$'`),
  ],
);

export const rezervacije = pgTable(
  "rezervacije",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    terenId: uuid("teren_id")
      .notNull()
      .references(() => tereni.id, { onDelete: "restrict" }),
    igracId: uuid("igrac_id")
      .notNull()
      .references(() => igraci.id, { onDelete: "restrict" }),
    pocetak: timestamp("pocetak", { withTimezone: true }).notNull(),
    kraj: timestamp("kraj", { withTimezone: true }).notNull(),
    // Price in whole dinars, fixed at the moment of booking.
    cenaRsd: integer("cena_rsd"),
    status: statusRezervacijeEnum("status").notNull().default("potvrdjena"),
    // Phone vs online lets the club see how much the online booking is actually used.
    izvor: izvorRezervacijeEnum("izvor").notNull(),
    // The account that booked online. An account only ever sees its own online bookings,
    // never the history of the phone number it typed in. See decision 010.
    korisnikId: text("korisnik_id").references(() => korisnici.id, { onDelete: "set null" }),
    kreirano: kreirano(),
  },
  (t) => [
    check("rezervacije_pocetak_pre_kraja", sql`${t.pocetak} < ${t.kraj}`),
    check("rezervacije_cena_pozitivna", sql`${t.cenaRsd} is null or ${t.cenaRsd} >= 0`),
    index("rezervacije_igrac_idx").on(t.igracId),
    index("rezervacije_korisnik_idx").on(t.korisnikId),
    // The no-overlap rule (EXCLUDE constraint) lives in a hand-written migration,
    // because Drizzle cannot express it in the schema.
  ],
);

// Accounts blocked from booking online in one club (decision 010).
export const blokade = pgTable(
  "blokade",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    klubId: uuid("klub_id")
      .notNull()
      .references(() => klubovi.id, { onDelete: "cascade" }),
    korisnikId: text("korisnik_id")
      .notNull()
      .references(() => korisnici.id, { onDelete: "cascade" }),
    kreirano: kreirano(),
  },
  (t) => [unique("blokade_klub_korisnik_unique").on(t.klubId, t.korisnikId)],
);

// Login tables used by Better Auth (decisions 009 and 010).
// Property names are the ones Better Auth expects; column names are Serbian like the rest.
const azurirano = () =>
  timestamp("azurirano", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const korisnici = pgTable("korisnici", {
  id: text("id").primaryKey(),
  name: text("ime").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_potvrdjen").notNull().default(false),
  image: text("slika"),
  // Typed in by the player, never verified. Only used to fill in the booking form.
  telefon: text("telefon"),
  createdAt: timestamp("kreirano", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: azurirano(),
});

export const sesije = pgTable(
  "sesije",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("istice", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_adresa"),
    userAgent: text("uredjaj"),
    userId: text("korisnik_id")
      .notNull()
      .references(() => korisnici.id, { onDelete: "cascade" }),
    createdAt: timestamp("kreirano", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: azurirano(),
  },
  (t) => [index("sesije_korisnik_idx").on(t.userId)],
);

// One row per way of logging in: "credential" (email and password) or "google".
export const naciniPrijave = pgTable(
  "nacini_prijave",
  {
    id: text("id").primaryKey(),
    accountId: text("nalog_id").notNull(),
    providerId: text("nacin").notNull(),
    userId: text("korisnik_id")
      .notNull()
      .references(() => korisnici.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_istice", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_istice", { withTimezone: true }),
    scope: text("scope"),
    // Scrypt hash, never the password itself.
    password: text("lozinka"),
    createdAt: timestamp("kreirano", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: azurirano(),
  },
  (t) => [index("nacini_prijave_korisnik_idx").on(t.userId)],
);

// Short-lived codes for email confirmation and password reset links.
export const verifikacije = pgTable(
  "verifikacije",
  {
    id: text("id").primaryKey(),
    identifier: text("oznaka").notNull(),
    value: text("vrednost").notNull(),
    expiresAt: timestamp("istice", { withTimezone: true }).notNull(),
    createdAt: timestamp("kreirano", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: azurirano(),
  },
  (t) => [index("verifikacije_oznaka_idx").on(t.identifier)],
);
