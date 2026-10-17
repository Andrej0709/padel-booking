// Serbian phone numbers are written many ways ("064 123 4567", "+381 64/123-4567", "00381...").
// They are always stored as +381..., so one player is never saved twice. See decision 006.
export function normalizujTelefon(unos: string): string | null {
  let broj = unos.replace(/[\s\-/().]/g, "");
  if (broj.startsWith("00")) broj = "+" + broj.slice(2);
  else if (broj.startsWith("381")) broj = "+" + broj;
  else if (broj.startsWith("0")) broj = "+381" + broj.slice(1);
  return /^\+[0-9]{8,15}$/.test(broj) ? broj : null;
}
