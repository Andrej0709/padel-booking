"use server";

import { refresh } from "next/cache";
import { pool } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/pristup";
import { SATI_ZA_OTKAZIVANJE } from "@/lib/pravila";

export async function otkaziSvoju(id: string): Promise<{ greska?: string }> {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) return { greska: "Prijavi se ponovo." };
  const { rowCount } = await pool.query(
    `update rezervacije set status = 'otkazana'
     where id = $1 and korisnik_id = $2 and status = 'potvrdjena'
       and pocetak > now() + make_interval(hours => $3)`,
    [id, korisnik.id, SATI_ZA_OTKAZIVANJE],
  );
  if (!rowCount) {
    return { greska: `Termin se može otkazati najkasnije ${SATI_ZA_OTKAZIVANJE} sati pre početka. Pozovi klub.` };
  }
  refresh();
  return {};
}
