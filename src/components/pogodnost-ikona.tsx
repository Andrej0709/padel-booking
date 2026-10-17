import { Car, Coffee, Lightbulb, Lockers, Racquet, ShoppingBag, Shower, WifiHigh } from "@phosphor-icons/react/ssr";
import type { Pogodnost } from "@/lib/pogodnosti";

const IKONE = {
  parking: Car,
  svlacionica: Lockers,
  tus: Shower,
  kafic: Coffee,
  oprema: Racquet,
  osvetljenje: Lightbulb,
  wifi: WifiHigh,
  prodavnica: ShoppingBag,
} satisfies Record<Pogodnost, unknown>;

export function PogodnostIkona({ kljuc, size = 20 }: { kljuc: Pogodnost; size?: number }) {
  const Ikona = IKONE[kljuc];
  return <Ikona size={size} />;
}
