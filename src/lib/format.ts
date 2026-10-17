// How times, dates, prices and phone numbers are written on screen. Works in the browser and on the server.

export function uVreme(minuti: number) {
  const m = ((minuti % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const veliko = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const uDatum = (datum: string) => new Date(`${datum}T12:00:00Z`);

// "Subota, 24. oktobar 2026."
export function dugiDatum(datum: string) {
  return veliko(
    new Intl.DateTimeFormat("sr-Latn-RS", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(uDatum(datum)),
  );
}

// "Sub, 24. okt"
export function kratkiDatum(datum: string) {
  const d = uDatum(datum);
  const dan = new Intl.DateTimeFormat("sr-Latn-RS", { weekday: "short", timeZone: "UTC" }).format(d);
  const mesec = new Intl.DateTimeFormat("sr-Latn-RS", { month: "short", timeZone: "UTC" }).format(d);
  return `${veliko(dan.replace(".", ""))}, ${d.getUTCDate()}. ${mesec.replace(".", "")}`;
}

export function danUNedelji(datum: string) {
  return veliko(
    new Intl.DateTimeFormat("sr-Latn-RS", { weekday: "short", timeZone: "UTC" }).format(uDatum(datum)).replace(".", ""),
  );
}

export function brojDana(datum: string) {
  return uDatum(datum).getUTCDate();
}

// 4800 -> "4.800 din"
export function dinari(iznos: number | null) {
  return iznos === null ? "—" : `${iznos.toLocaleString("sr-RS")} din`;
}

// "+381641234567" -> "064 123 4567"
export function lepTelefon(broj: string) {
  if (!broj.startsWith("+381")) return broj;
  const d = "0" + broj.slice(4);
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

// Serbian plural: 1 slobodan, 2 slobodna, 5 slobodnih.
export function mnozina(n: number, jedan: string, dva: string, pet: string) {
  const d = n % 10;
  const s = n % 100;
  if (d === 1 && s !== 11) return jedan;
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return dva;
  return pet;
}
