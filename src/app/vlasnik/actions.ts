"use server";

import { refresh } from "next/cache";
import { pool } from "@/lib/db";
import { zahtevajClana } from "@/lib/pristup";
import { upisiRezervaciju } from "@/lib/rezervacije";
import { normalizujTelefon } from "@/lib/telefon";

// Actions on the owner's schedule. Each one checks again who is calling:
// Server Actions can be called directly, not only through our buttons.

export type UnosRezervacije = {
  terenId: string;
  datum: string;
  od: number;
  trajanje: number;
  ime: string;
  telefon: string;
  cena: string;
};

export async function upisiTelefonskuRezervaciju(unos: UnosRezervacije): Promise<{ greska?: string }> {
  const clan = await zahtevajClana("/vlasnik");
  const ime = unos.ime.trim();
  const telefon = normalizujTelefon(unos.telefon);
  const cenaTekst = unos.cena.replace(/[.\s]/g, "");
  if (!ime) return { greska: "Upiši ime igrača." };
  if (!telefon) return { greska: "Broj telefona nije ispravan. Primer: 064 123 4567" };

  const rezultat = await upisiRezervaciju(clan.klub, {
    terenId: unos.terenId,
    datum: unos.datum,
    od: unos.od,
    trajanje: unos.trajanje,
    ime,
    telefon,
    cenaRsd: cenaTekst === "" ? null : Number(cenaTekst),
    izvor: "telefon",
    korisnikId: null,
  });
  if (rezultat.greska) return { greska: rezultat.greska };
  refresh();
  return {};
}

const STATUSI = ["otkazana", "nedolazak", "odigrana", "potvrdjena"] as const;

// Cancelling frees the court (cancelled bookings do not count for overlap).
// "nedolazak" (no-show) builds the player's history. See decision 006.
export async function promeniStatus(id: string, status: (typeof STATUSI)[number]) {
  const clan = await zahtevajClana("/vlasnik");
  if (!STATUSI.includes(status)) return;
  await pool.query(
    `update rezervacije r set status = $3
     from tereni t
     where r.id = $1 and t.id = r.teren_id and t.klub_id = $2`,
    [id, clan.klub.id, status],
  );
  refresh();
}

// Stops an account from booking online in this club (decision 010). Phone bookings still work.
export async function blokirajNalog(korisnikId: string, blokiraj: boolean) {
  const clan = await zahtevajClana("/vlasnik");
  if (blokiraj) {
    await pool.query(
      `insert into blokade (klub_id, korisnik_id) values ($1, $2) on conflict do nothing`,
      [clan.klub.id, korisnikId],
    );
  } else {
    await pool.query(`delete from blokade where klub_id = $1 and korisnik_id = $2`, [clan.klub.id, korisnikId]);
  }
  refresh();
}
