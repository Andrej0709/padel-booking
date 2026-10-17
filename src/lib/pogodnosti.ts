// What a club offers besides the courts, shown on the club page (decision 013).
// Safe for browser code: no database access.

export const POGODNOSTI = {
  parking: "Parking",
  svlacionica: "Svlačionica",
  tus: "Tuš",
  kafic: "Kafić",
  oprema: "Iznajmljivanje reketa",
  osvetljenje: "Rasveta za noćnu igru",
  wifi: "Wi-Fi",
  prodavnica: "Prodavnica opreme",
} as const;

export type Pogodnost = keyof typeof POGODNOSTI;

export function jePogodnost(kljuc: string): kljuc is Pogodnost {
  return kljuc in POGODNOSTI;
}
