"use server";

import { refresh } from "next/cache";
import { DatabaseError } from "pg";
import { pool } from "@/lib/db";
import { zahtevajVlasnika } from "@/lib/pristup";
import { normalizujTelefon } from "@/lib/telefon";

// Club settings. Only the owner may change them, not reception (see the system map).

export type Stanje = { poruka?: string; greska?: string };

export async function sacuvajKlub(_: Stanje, podaci: FormData): Promise<Stanje> {
  const { klub } = await zahtevajVlasnika("/vlasnik/podesavanja");
  const naziv = String(podaci.get("naziv") ?? "").trim();
  const adresa = String(podaci.get("adresa") ?? "").trim();
  const telefonUnos = String(podaci.get("telefon") ?? "").trim();
  const cenaUnos = String(podaci.get("cena") ?? "").replace(/[.\s]/g, "");
  if (!naziv) return { greska: "Upiši naziv kluba." };
  const telefon = telefonUnos ? normalizujTelefon(telefonUnos) : null;
  if (telefonUnos && !telefon) return { greska: "Broj telefona kluba nije ispravan." };
  const cena = cenaUnos === "" ? null : Number(cenaUnos);
  if (cena !== null && (!Number.isInteger(cena) || cena < 0)) return { greska: "Cena mora biti ceo broj dinara." };

  await pool.query(
    `update klubovi set naziv = $2, adresa = nullif($3, ''), telefon = $4, cena_po_satu_rsd = $5 where id = $1`,
    [klub.id, naziv, adresa, telefon, cena],
  );
  refresh();
  return { poruka: "Sačuvano." };
}

export async function dodajTeren(_: Stanje, podaci: FormData): Promise<Stanje> {
  const { klub } = await zahtevajVlasnika("/vlasnik/podesavanja");
  const naziv = String(podaci.get("naziv") ?? "").trim();
  const vrsta = podaci.get("vrsta") === "otvoren" ? "otvoren" : "zatvoren";
  if (!naziv) return { greska: "Upiši naziv terena." };
  try {
    // A new court starts with 08:00–23:00 every day; the owner adjusts it below.
    await pool.query(
      `with t as (insert into tereni (klub_id, naziv, vrsta) values ($1, $2, $3) returning id)
       insert into radno_vreme (teren_id, dan, otvara, zatvara)
       select t.id, d, '08:00', '23:00' from t, generate_series(1, 7) d`,
      [klub.id, naziv, vrsta],
    );
  } catch (error) {
    if (error instanceof DatabaseError && error.constraint === "tereni_klub_naziv_unique") {
      return { greska: "Teren sa tim nazivom već postoji." };
    }
    throw error;
  }
  refresh();
  return { poruka: "Teren je dodat." };
}

// Saves one court: name, indoor/outdoor, active, and opening hours for each day of the week.
export async function sacuvajTeren(_: Stanje, podaci: FormData): Promise<Stanje> {
  const { klub } = await zahtevajVlasnika("/vlasnik/podesavanja");
  const terenId = String(podaci.get("terenId") ?? "");
  const naziv = String(podaci.get("naziv") ?? "").trim();
  const vrsta = podaci.get("vrsta") === "otvoren" ? "otvoren" : "zatvoren";
  const aktivan = podaci.get("aktivan") === "on";
  if (!naziv) return { greska: "Upiši naziv terena." };

  const dani: { dan: number; otvara: string; zatvara: string }[] = [];
  for (let dan = 1; dan <= 7; dan++) {
    if (podaci.get(`radi-${dan}`) !== "on") continue;
    const otvara = String(podaci.get(`otvara-${dan}`) ?? "");
    const zatvara = String(podaci.get(`zatvara-${dan}`) ?? "");
    if (!/^\d{2}:\d{2}$/.test(otvara) || !/^\d{2}:\d{2}$/.test(zatvara) || otvara >= zatvara) {
      return { greska: "Svaki dan mora da počne pre nego što se završi (na primer 08:00–23:00)." };
    }
    dani.push({ dan, otvara, zatvara });
  }

  const veza = await pool.connect();
  try {
    await veza.query("begin");
    const { rowCount } = await veza.query(
      `update tereni set naziv = $3, vrsta = $4, aktivan = $5 where id = $1 and klub_id = $2`,
      [terenId, klub.id, naziv, vrsta, aktivan],
    );
    if (!rowCount) {
      await veza.query("rollback");
      return { greska: "Teren nije pronađen." };
    }
    await veza.query(`delete from radno_vreme where teren_id = $1`, [terenId]);
    for (const d of dani) {
      await veza.query(`insert into radno_vreme (teren_id, dan, otvara, zatvara) values ($1, $2, $3, $4)`, [
        terenId,
        d.dan,
        d.otvara,
        d.zatvara,
      ]);
    }
    await veza.query("commit");
  } catch (error) {
    await veza.query("rollback");
    if (error instanceof DatabaseError && error.constraint === "tereni_klub_naziv_unique") {
      return { greska: "Teren sa tim nazivom već postoji." };
    }
    throw error;
  } finally {
    veza.release();
  }
  refresh();
  return { poruka: "Sačuvano. Postojeće rezervacije se ne menjaju." };
}
