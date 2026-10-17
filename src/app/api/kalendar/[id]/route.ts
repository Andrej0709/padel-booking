import { pool } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/pristup";

// "Add to calendar": one booking as an .ics file that phones and Google Calendar open directly.
// Only the account that made the booking online can download it (decision 010).
export async function GET(_: Request, { params }: RouteContext<"/api/kalendar/[id]">) {
  const { id } = await params;
  const korisnik = await trenutniKorisnik();
  if (!korisnik) return new Response("Prijavi se.", { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Nije pronađeno.", { status: 404 });

  const { rows } = await pool.query<{ pocetak: Date; kraj: Date; teren: string; klub: string; adresa: string | null; telefon: string | null }>(
    `select r.pocetak, r.kraj, t.naziv as teren, k.naziv as klub, k.adresa, k.telefon
     from rezervacije r join tereni t on t.id = r.teren_id join klubovi k on k.id = t.klub_id
     where r.id = $1 and r.korisnik_id = $2 and r.status <> 'otkazana'`,
    [id, korisnik.id],
  );
  const r = rows[0];
  if (!r) return new Response("Nije pronađeno.", { status: 404 });

  const vreme = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const tekst = (s: string) => s.replace(/[\\,;]/g, (z) => `\\${z}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//padel-booking//SR",
    "BEGIN:VEVENT",
    `UID:${id}@padel-booking`,
    `DTSTAMP:${vreme(new Date())}`,
    `DTSTART:${vreme(r.pocetak)}`,
    `DTEND:${vreme(r.kraj)}`,
    `SUMMARY:${tekst(`Padel · ${r.klub}`)}`,
    `DESCRIPTION:${tekst(`${r.teren}. Plaćanje u klubu.${r.telefon ? ` Telefon kluba: ${r.telefon}` : ""}`)}`,
    ...(r.adresa ? [`LOCATION:${tekst(r.adresa)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Padel za 2 sata",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="padel-termin.ics"`,
    },
  });
}
