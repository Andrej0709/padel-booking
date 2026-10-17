import Link from "next/link";
import { ArrowUpRight, CalendarBlank, ChartLineUp, GearSix, Users, UsersThree } from "@phosphor-icons/react/ssr";
import { Znak } from "@/components/znak";
import { PrekidacTeme } from "@/components/prekidac-teme";
import type { Clan } from "@/lib/pristup";
import { inicijali } from "@/lib/format";
import { Odjava } from "@/components/odjava";

const STAVKE = [
  { kljuc: "raspored", naziv: "Raspored", href: "/vlasnik", Ikona: CalendarBlank },
  { kljuc: "pregled", naziv: "Pregled", href: "/vlasnik/pregled", Ikona: ChartLineUp, samoVlasnik: true },
  { kljuc: "igraci", naziv: "Igrači", href: "/vlasnik/igraci", Ikona: Users },
  { kljuc: "podesavanja", naziv: "Podešavanja", href: "/vlasnik/podesavanja", Ikona: GearSix, samoVlasnik: true },
  { kljuc: "tim", naziv: "Tim", href: "/vlasnik/tim", Ikona: UsersThree, samoVlasnik: true },
] as const;

export type Stavka = (typeof STAVKE)[number]["kljuc"];

// Frame of every owner page (decision 013).
// Computer: night blue menu on the left. Phone: slim bar on top and tabs at the bottom, like an app.
export function VlasnikOkvir({
  clan,
  aktivno,
  children,
  punaVisina = false,
}: {
  clan: Clan;
  aktivno: Stavka;
  children: React.ReactNode;
  punaVisina?: boolean;
}) {
  const stavke = STAVKE.filter((s) => !("samoVlasnik" in s) || clan.uloga === "vlasnik");
  const uloga = clan.uloga === "vlasnik" ? "vlasnik" : "recepcija";
  return (
    <div className={`flex ${punaVisina ? "h-dvh" : "min-h-dvh"}`}>
      <aside className="nocno-nebo sticky top-0 hidden h-dvh w-[248px] flex-none flex-col gap-6 px-4 py-5 lg:flex">
        <Link href="/vlasnik" className="flex items-center gap-3 px-2">
          <Znak velicina={38} tamniji />
          <span className="min-w-0">
            <span className="block truncate font-naslov text-lg font-bold leading-tight">{clan.klub.naziv}</span>
            <span className="block text-xs text-night-ink/60">upravljanje klubom</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {stavke.map(({ kljuc, naziv, href, Ikona }) => {
            const aktivan = aktivno === kljuc;
            return (
              <Link
                key={kljuc}
                href={href}
                aria-current={aktivan ? "page" : undefined}
                className={`group relative flex h-11 items-center gap-3 rounded-full px-4 text-[15px] font-semibold transition-colors duration-300 ease-glatko ${
                  aktivan ? "bg-white/12 text-night-ink" : "text-night-ink/65 hover:bg-white/6 hover:text-night-ink"
                }`}
              >
                <Ikona size={20} weight={aktivan ? "fill" : "regular"} />
                {naziv}
                {aktivan && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-lime" />}
              </Link>
            );
          })}
        </nav>
        <Link
          href={`/k/${clan.klub.slug}`}
          className="group flex items-center justify-between rounded-[18px] bg-white/8 p-3 pl-4 text-sm font-semibold ring-1 ring-white/10 transition-colors hover:bg-white/12"
        >
          <span>
            <span className="block">Stranica za igrače</span>
            <span className="block text-xs font-medium text-night-ink/60">/k/{clan.klub.slug}</span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-lime-ink transition-transform duration-300 ease-glatko group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <ArrowUpRight size={16} weight="bold" />
          </span>
        </Link>
        <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-2 pb-2">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/12 text-sm font-bold">
              {inicijali(clan.ime)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{clan.ime}</span>
              <span className="block text-xs text-night-ink/60">{uloga}</span>
            </span>
          </div>
          <PrekidacTeme naTamnom />
          <Odjava naTamnom siroko />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line/70 bg-staklo px-4 py-2.5 backdrop-blur-xl lg:hidden">
          <Link href="/vlasnik" className="flex min-w-0 flex-1 items-center gap-2.5">
            <Znak velicina={32} />
            <span className="min-w-0">
              <span className="block truncate font-naslov text-[17px] font-bold leading-tight">{clan.klub.naziv}</span>
              <span className="block text-xs text-muted">
                {clan.ime} · {uloga}
              </span>
            </span>
          </Link>
          <PrekidacTeme mali />
          <Odjava />
        </header>

        <div className={`flex min-h-0 flex-1 flex-col ${punaVisina ? "" : "pb-20 lg:pb-0"}`}>{children}</div>

        <nav
          className={`z-40 flex border-t border-line/70 bg-staklo px-1 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 backdrop-blur-xl lg:hidden ${
            punaVisina ? "" : "fixed inset-x-0 bottom-0"
          }`}
        >
          {stavke.map(({ kljuc, naziv, href, Ikona }) => {
            const aktivan = aktivno === kljuc;
            return (
              <Link
                key={kljuc}
                href={href}
                aria-current={aktivan ? "page" : undefined}
                className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                  aktivan ? "text-brand" : "text-muted"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-glatko ${aktivan ? "bg-hover" : ""}`}
                >
                  <Ikona size={21} weight={aktivan ? "fill" : "regular"} />
                </span>
                {naziv}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

