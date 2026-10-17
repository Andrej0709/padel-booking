import Link from "next/link";
import { Znak } from "@/components/znak";
import { PrekidacTeme } from "@/components/prekidac-teme";
import type { Clan } from "@/lib/pristup";
import { Odjava } from "./odjava";

const STAVKE = [
  { kljuc: "raspored", naziv: "Raspored", href: "/vlasnik" },
  { kljuc: "igraci", naziv: "Igrači", href: "/vlasnik/igraci" },
  { kljuc: "podesavanja", naziv: "Podešavanja", href: "/vlasnik/podesavanja", samoVlasnik: true },
  { kljuc: "tim", naziv: "Tim", href: "/vlasnik/tim", samoVlasnik: true },
] as const;

export type Stavka = (typeof STAVKE)[number]["kljuc"];

// Top bar of every owner page: club, menu, theme and logout.
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
  return (
    <div className={`flex flex-col ${punaVisina ? "h-dvh" : "min-h-dvh"}`}>
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-3 py-2.5 sm:px-6">
        <Link href="/vlasnik" className="flex min-w-0 items-center gap-3">
          <Znak velicina={36} />
          <span className="min-w-0">
            <span className="block truncate font-naslov text-xl font-bold leading-none">{clan.klub.naziv}</span>
            <span className="mt-1 block text-xs text-muted">
              {clan.ime} · {clan.uloga === "vlasnik" ? "vlasnik" : "recepcija"}
            </span>
          </span>
        </Link>
        <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {stavke.map((s) => (
            <Link
              key={s.kljuc}
              href={s.href}
              aria-current={aktivno === s.kljuc ? "page" : undefined}
              className={`flex h-10 flex-none items-center rounded-xl px-3.5 text-[15px] font-semibold ${
                aktivno === s.kljuc ? "bg-hover text-brand" : "text-muted hover:bg-surface2 hover:text-ink"
              }`}
            >
              {s.naziv}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/k/${clan.klub.slug}`}
            className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-brand hover:bg-surface2 md:flex"
          >
            Stranica za igrače ↗
          </Link>
          <PrekidacTeme mali />
          <Odjava />
        </div>
      </header>
      {children}
    </div>
  );
}
