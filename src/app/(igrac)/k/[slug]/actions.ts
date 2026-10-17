"use server";

import { refresh } from "next/cache";
import { pool } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/pristup";
import { cenaTermina, danasU, sadaUMinutima, ucitajKlubPoSlugu } from "@/lib/raspored";
import { upisiRezervaciju } from "@/lib/rezervacije";
import { normalizujTelefon } from "@/lib/telefon";

// Online booking by a player (decision 010): an account is required, and a few rules
// limit what a fake or careless account can do.
const NAJVISE_BUDUCIH = 2;
const NAJVISE_NEDOLAZAKA = 2;

export type UnosOnline = {
  slug: string;
  terenId: string;
  datum: string;
  od: number;
  trajanje: number;
  ime: string;
  telefon: string;
};

export async function rezervisiOnline(unos: UnosOnline): Promise<{ greska?: string; prijava?: boolean; cenaRsd?: number | null; id?: string }> {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) return { prijava: true, greska: "Prijavi se da bi rezervisao termin." };
  const klub = await ucitajKlubPoSlugu(unos.slug);
  if (!klub) return { greska: "Klub nije pronađen." };

  const ime = unos.ime.trim();
  const telefon = normalizujTelefon(unos.telefon);
  if (!ime) return { greska: "Upiši ime." };
  if (!telefon) return { greska: "Broj telefona nije ispravan. Primer: 064 123 4567" };

  const danas = danasU(klub.vremenskaZona);
  if (unos.datum < danas || (unos.datum === danas && unos.od <= sadaUMinutima(klub.vremenskaZona))) {
    return { greska: "Taj termin je već prošao. Izaberi drugi." };
  }

  const { rows } = await pool.query<{ blokiran: boolean; buducih: number; nedolazaka: number }>(
    `select exists(select 1 from blokade where klub_id = $1 and korisnik_id = $2) as blokiran,
            (select count(*)::int from rezervacije r join tereni t on t.id = r.teren_id
             where t.klub_id = $1 and r.korisnik_id = $2 and r.status = 'potvrdjena' and r.pocetak > now()) as buducih,
            (select count(*)::int from rezervacije r join tereni t on t.id = r.teren_id
             where t.klub_id = $1 and r.korisnik_id = $2 and r.status = 'nedolazak') as nedolazaka`,
    [klub.id, korisnik.id],
  );
  const pravila = rows[0];
  if (pravila.blokiran || pravila.nedolazaka >= NAJVISE_NEDOLAZAKA) {
    return { greska: "Online rezervacija ti trenutno nije dostupna u ovom klubu. Pozovi klub telefonom." };
  }
  if (pravila.buducih >= NAJVISE_BUDUCIH) {
    return {
      greska: `Možeš imati najviše ${NAJVISE_BUDUCIH} zakazana termina u ovom klubu. Otkaži jedan u Mojim rezervacijama ili pozovi klub.`,
    };
  }

  const cenaRsd = cenaTermina(klub, unos.trajanje);
  const rezultat = await upisiRezervaciju(klub, {
    terenId: unos.terenId,
    datum: unos.datum,
    od: unos.od,
    trajanje: unos.trajanje,
    ime,
    telefon,
    cenaRsd,
    izvor: "online",
    korisnikId: korisnik.id,
  });
  if (rezultat.greska) {
    // Someone else may have taken the slot a moment ago: show fresh free times.
    refresh();
    return { greska: rezultat.greska };
  }

  // Remember the phone for the next booking (never verified, see decision 010).
  await pool.query(`update korisnici set telefon = $2 where id = $1`, [korisnik.id, telefon]);
  refresh();
  return { cenaRsd, id: rezultat.id };
}
