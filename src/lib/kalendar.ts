// Date and time helpers with no database access, safe to use in browser code.

export const TRAJANJA = [60, 90, 120] as const;
export const KORAK = 30;

// Today's date in the club's time zone, as YYYY-MM-DD.
export function danasU(vremenskaZona: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: vremenskaZona }).format(new Date());
}

// Minutes since midnight right now, in the club's time zone.
export function sadaUMinutima(vremenskaZona: string): number {
  const delovi = new Intl.DateTimeFormat("en-GB", {
    timeZone: vremenskaZona,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const deo = (tip: string) => Number(delovi.find((d) => d.type === tip)?.value);
  return deo("hour") * 60 + deo("minute");
}

export function pomeriDatum(datum: string, dana: number): string {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dana);
  return d.toISOString().slice(0, 10);
}

export function jeIspravanDatum(datum: string | undefined): datum is string {
  return !!datum && /^\d{4}-\d{2}-\d{2}$/.test(datum) && !isNaN(Date.parse(datum));
}
