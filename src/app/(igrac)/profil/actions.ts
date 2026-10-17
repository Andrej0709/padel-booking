"use server";

import { refresh } from "next/cache";
import { pool } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/pristup";
import { normalizujTelefon } from "@/lib/telefon";

export type Stanje = { poruka?: string; greska?: string };

// The player changes their own name and phone. The phone is still never verified (decision 010):
// it only fills in the booking form.
export async function sacuvajProfil(_: Stanje, podaci: FormData): Promise<Stanje> {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) return { greska: "Prijavi se ponovo." };
  const ime = String(podaci.get("ime") ?? "").trim().slice(0, 80);
  const unos = String(podaci.get("telefon") ?? "").trim();
  if (!ime) return { greska: "Upiši ime." };
  const telefon = unos ? normalizujTelefon(unos) : null;
  if (unos && !telefon) return { greska: "Broj telefona nije ispravan. Primer: 064 123 4567" };
  await pool.query(`update korisnici set ime = $2, telefon = $3, azurirano = now() where id = $1`, [korisnik.id, ime, telefon]);
  refresh();
  return { poruka: "Sačuvano." };
}
