import { DatabaseError } from "pg";
import { pool } from "@/lib/db";
import { uVreme } from "@/lib/format";
import { jeIspravanDatum, TRAJANJA, type Klub } from "@/lib/raspored";

// Saving a booking, shared by the owner's schedule (phone calls) and the player page (online).
// The database itself refuses overlapping bookings (EXCLUDE rule in drizzle/0001), so two
// people saving the same slot at the same second cannot both succeed.

export type NovaRezervacija = {
  terenId: string;
  datum: string;
  od: number;
  trajanje: number;
  ime: string;
  telefon: string; // already normalized to +381...
  cenaRsd: number | null;
  izvor: "telefon" | "online";
  korisnikId: string | null;
};

export async function upisiRezervaciju(klub: Klub, r: NovaRezervacija): Promise<{ greska?: string; id?: string }> {
  if (!jeIspravanDatum(r.datum) || !Number.isInteger(r.od) || r.od < 0 || r.od >= 1440) {
    return { greska: "Neispravan datum ili vreme." };
  }
  if (!(TRAJANJA as readonly number[]).includes(r.trajanje)) return { greska: "Izaberi trajanje termina." };
  if (r.cenaRsd !== null && (!Number.isInteger(r.cenaRsd) || r.cenaRsd < 0)) {
    return { greska: "Cena mora biti ceo broj dinara." };
  }
  const vreme = uVreme(r.od);

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
    [r.terenId, klub.id, r.datum, vreme, r.trajanje],
  );
  if (!rowCount) return { greska: "Teren ne radi u to vreme." };

  try {
    // One statement: if the booking is refused, the new player is not saved either.
    // An existing player (same phone) keeps the name they were first saved with.
    const { rows } = await pool.query<{ id: string }>(
      `with igrac as (
         insert into igraci (klub_id, ime, telefon)
         values ($1, $2, $3)
         on conflict (klub_id, telefon) do update set ime = igraci.ime
         returning id
       ),
       termin as (
         select ($5::date + $6::time) at time zone $9 as pocetak
       )
       insert into rezervacije (teren_id, igrac_id, pocetak, kraj, cena_rsd, izvor, korisnik_id)
       select $4, igrac.id, termin.pocetak, termin.pocetak + make_interval(mins => $7), $8, $10, $11
       from igrac, termin
       returning id`,
      [klub.id, r.ime, r.telefon, r.terenId, r.datum, vreme, r.trajanje, r.cenaRsd, klub.vremenskaZona, r.izvor, r.korisnikId],
    );
    return { id: rows[0].id };
  } catch (error) {
    if (error instanceof DatabaseError && error.constraint === "rezervacije_bez_preklapanja") {
      return { greska: "Teren je već zauzet u delu tog vremena. Izaberi drugo vreme ili teren." };
    }
    console.error("Upis rezervacije nije uspeo", error);
    return { greska: "Upis nije uspeo. Pokušaj ponovo." };
  }
}
