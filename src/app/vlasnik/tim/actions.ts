"use server";

import { refresh } from "next/cache";
import { DatabaseError } from "pg";
import { pool } from "@/lib/db";
import { zahtevajVlasnika } from "@/lib/pristup";
import type { Stanje } from "../podesavanja/actions";

// Team members get access by email (decision 009). Adding an email here is the only way in:
// logging in with Google or a new account never creates staff on its own.

export async function dodajClana(_: Stanje, podaci: FormData): Promise<Stanje> {
  const { klub } = await zahtevajVlasnika("/vlasnik/tim");
  const ime = String(podaci.get("ime") ?? "").trim();
  const email = String(podaci.get("email") ?? "").trim().toLowerCase();
  const uloga = podaci.get("uloga") === "vlasnik" ? "vlasnik" : "recepcija";
  if (!ime) return { greska: "Upiši ime." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { greska: "Email nije ispravan." };
  try {
    await pool.query(`insert into vlasnici (klub_id, ime, email, uloga) values ($1, $2, $3, $4)`, [
      klub.id,
      ime,
      email,
      uloga,
    ]);
  } catch (error) {
    if (error instanceof DatabaseError && error.code === "23505") {
      return { greska: "Ovaj email je već u nekom timu." };
    }
    throw error;
  }
  refresh();
  return { poruka: `${ime} je dodat. Neka se prijavi sa ${email}.` };
}

export async function ukloniClana(id: string): Promise<Stanje> {
  const clan = await zahtevajVlasnika("/vlasnik/tim");
  const { rows } = await pool.query<{ email: string; uloga: string }>(
    `select email, uloga from vlasnici where id = $1 and klub_id = $2`,
    [id, clan.klub.id],
  );
  const meta = rows[0];
  if (!meta) return { greska: "Član nije pronađen." };
  if (meta.email.toLowerCase() === clan.korisnik.email.toLowerCase()) {
    return { greska: "Ne možeš da ukloniš sebe." };
  }
  await pool.query(`delete from vlasnici where id = $1 and klub_id = $2`, [id, clan.klub.id]);
  refresh();
  return { poruka: "Uklonjen." };
}
