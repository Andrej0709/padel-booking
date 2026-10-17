"use server";

import { refresh } from "next/cache";
import { DatabaseError } from "pg";
import { pool } from "@/lib/db";
import { jeIspravanDatum, ucitajKlub } from "@/lib/raspored";
import { normalizujTelefon } from "@/lib/telefon";

// On error the form shows what was typed again, so the owner does not retype it.
export type StanjeUpisa = { greska?: string; uspeh?: boolean; unos?: Record<string, string> };

const TRAJANJA = [60, 90, 120];

// Saves a booking taken over the phone.
// The database itself refuses overlapping bookings (EXCLUDE rule in drizzle/0001), so two
// people saving the same slot at the same second cannot both succeed.
export async function upisiRezervaciju(
  _prethodno: StanjeUpisa,
  formData: FormData,
): Promise<StanjeUpisa> {
  const unos: Record<string, string> = {};
  for (const [k, v] of formData) if (!k.startsWith("$")) unos[k] = String(v);
  const greska = (poruka: string): StanjeUpisa => ({ greska: poruka, unos });

  // TODO: once owner login exists, take the club from the session instead.
  const klub = await ucitajKlub();
  if (!klub) return greska("Klub nije pronađen.");

  const terenId = String(formData.get("terenId") ?? "");
  const datum = String(formData.get("datum") ?? "");
  const vreme = String(formData.get("vreme") ?? "");
  const trajanje = Number(formData.get("trajanje"));
  const ime = String(formData.get("ime") ?? "").trim();
  const telefon = normalizujTelefon(String(formData.get("telefon") ?? ""));
  const cenaUnos = String(formData.get("cena") ?? "").trim();
  const cena = cenaUnos === "" ? null : Number(cenaUnos);

  if (!jeIspravanDatum(datum) || !/^\d{2}:\d{2}$/.test(vreme)) {
    return greska("Neispravan datum ili vreme.");
  }
  if (!TRAJANJA.includes(trajanje)) return greska("Izaberi trajanje termina.");
  if (!ime) return greska("Upiši ime igrača.");
  if (!telefon) return greska("Broj telefona nije ispravan. Primer: 064 123 4567");
  if (cena !== null && (!Number.isInteger(cena) || cena < 0)) {
    return greska("Cena mora biti ceo broj dinara.");
  }

  // Court must belong to this club and be open for the whole booking.
  // The last condition catches bookings that would run past midnight.
  const { rowCount } = await pool.query(
    `select 1
     from radno_vreme rv
     join tereni t on t.id = rv.teren_id
     where t.id = $1 and t.klub_id = $2 and t.aktivan
       and rv.dan = extract(isodow from $3::date)
       and rv.otvara <= $4::time
       and $4::time + make_interval(mins => $5) <= rv.zatvara
       and $4::time + make_interval(mins => $5) > $4::time`,
    [terenId, klub.id, datum, vreme, trajanje],
  );
  if (!rowCount) return greska("Teren ne radi u to vreme.");

  try {
    // One statement: if the booking is refused, the new player is not saved either.
    // An existing player (same phone) keeps the name they were first saved with.
    await pool.query(
      `with igrac as (
         insert into igraci (klub_id, ime, telefon)
         values ($1, $2, $3)
         on conflict (klub_id, telefon) do update set ime = igraci.ime
         returning id
       ),
       termin as (
         select ($5::date + $6::time) at time zone $9 as pocetak
       )
       insert into rezervacije (teren_id, igrac_id, pocetak, kraj, cena_rsd, izvor)
       select $4, igrac.id, termin.pocetak, termin.pocetak + make_interval(mins => $7), $8, 'telefon'
       from igrac, termin`,
      [klub.id, ime, telefon, terenId, datum, vreme, trajanje, cena, klub.vremenskaZona],
    );
  } catch (error) {
    if (error instanceof DatabaseError && error.constraint === "rezervacije_bez_preklapanja") {
      return greska("Teren je već zauzet u delu tog vremena. Izaberi drugo vreme ili teren.");
    }
    console.error("Upis rezervacije nije uspeo", error);
    return greska("Upis nije uspeo. Pokušaj ponovo.");
  }

  refresh();
  return { uspeh: true };
}

const NOVI_STATUSI = ["otkazana", "nedolazak", "odigrana", "potvrdjena"] as const;

// Cancelling frees the court (cancelled bookings do not count for overlap).
// "nedolazak" (no-show) builds the player's history. See decision 006.
export async function promeniStatus(formData: FormData) {
  const klub = await ucitajKlub();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!klub || !NOVI_STATUSI.includes(status as (typeof NOVI_STATUSI)[number])) return;

  await pool.query(
    `update rezervacije r set status = $3
     from tereni t
     where r.id = $1 and t.id = r.teren_id and t.klub_id = $2`,
    [id, klub.id, status],
  );
  refresh();
}
