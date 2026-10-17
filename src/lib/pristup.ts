import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { Klub } from "@/lib/raspored";

// Who is looking at the page, and what they may see.
// Every owner page and every Server Action checks this again on the server:
// hiding a button in the browser protects nothing.

export type Korisnik = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  telefon?: string | null;
};

export const trenutniKorisnik = cache(async (): Promise<Korisnik | null> => {
  const sesija = await auth.api.getSession({ headers: await headers() });
  return (sesija?.user as Korisnik | undefined) ?? null;
});

export type Clan = {
  korisnik: Korisnik;
  ime: string;
  uloga: "vlasnik" | "recepcija";
  klub: Klub;
};

// A member of a club's staff. Access is given by email: the owner adds an email to the team,
// and whoever logs in with that confirmed email gets in (decision 009).
export const trenutniClan = cache(async (): Promise<Clan | null> => {
  const korisnik = await trenutniKorisnik();
  if (!korisnik || !korisnik.emailVerified) return null;
  const { rows } = await pool.query<{ ime: string; uloga: Clan["uloga"] } & Klub>(
    `select v.ime, v.uloga, k.id, k.naziv, k.slug, k.adresa, k.telefon,
            k.vremenska_zona as "vremenskaZona", k.cena_po_satu_rsd as "cenaPoSatuRsd",
            k.opis, k.pogodnosti
     from vlasnici v join klubovi k on k.id = v.klub_id
     where lower(v.email) = lower($1)
     order by v.kreirano
     limit 1`,
    [korisnik.email],
  );
  const red = rows[0];
  if (!red) return null;
  const { ime, uloga, ...klub } = red;
  return { korisnik, ime, uloga, klub };
});

// For owner pages: sends people who are not logged in to the login page,
// and logged-in people without access to a page that explains why.
export async function zahtevajClana(povratak: string): Promise<Clan> {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) redirect(`/prijava?nazad=${encodeURIComponent(povratak)}`);
  const clan = await trenutniClan();
  if (!clan) redirect("/vlasnik/bez-pristupa");
  return clan;
}

export async function zahtevajVlasnika(povratak: string): Promise<Clan> {
  const clan = await zahtevajClana(povratak);
  if (clan.uloga !== "vlasnik") redirect("/vlasnik/bez-pristupa?samo=vlasnik");
  return clan;
}
