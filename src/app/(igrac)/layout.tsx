import Link from "next/link";
import { Suspense } from "react";
import { Znak } from "@/components/znak";
import { PrekidacTeme } from "@/components/prekidac-teme";
import { trenutniKorisnik } from "@/lib/pristup";
import { inicijali } from "@/lib/format";
import { DonjaTraka, DonjaTrakaZa, GornjiLinkovi, GornjiLinkoviZa } from "./donja-traka";

// Frame of every player page (decision 013): a floating glass bar on top, tabs at the bottom on a phone.
export default function IgracLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-40 px-3 pt-3 sm:px-5">
        <div className="pointer-events-auto mx-auto flex h-14 max-w-[1200px] items-center gap-3 rounded-full bg-staklo pl-2.5 pr-2 shadow-kartica ring-1 ring-line/60 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5 pr-2">
            <Znak velicina={34} />
            <span className="font-naslov text-lg font-bold tracking-[-0.01em]">padel-booking</span>
          </Link>
          <Suspense fallback={<GornjiLinkoviZa putanja="" />}>
            <GornjiLinkovi />
          </Suspense>
          <div className="ml-auto flex items-center gap-2">
            <PrekidacTeme mali />
            <Suspense fallback={<span className="ucitava h-11 w-24 rounded-full" />}>
              <Nalog />
            </Suspense>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</div>
      <Suspense fallback={<DonjaTrakaZa putanja="" />}>
        <DonjaTraka />
      </Suspense>
    </div>
  );
}

async function Nalog() {
  const korisnik = await trenutniKorisnik();
  if (!korisnik) {
    return (
      <Link
        href="/prijava"
        className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-surface transition-transform duration-300 ease-glatko active:scale-[0.97]"
      >
        Prijava
      </Link>
    );
  }
  return (
    <Link
      href="/profil"
      aria-label="Moj profil"
      className="flex h-11 items-center gap-2 rounded-full bg-surface pl-1 pr-1 ring-1 ring-line transition-colors hover:bg-surface2 sm:pr-4"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-sm font-bold text-lime-ink">
        {inicijali(korisnik.name)}
      </span>
      <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">{korisnik.name.split(" ")[0]}</span>
    </Link>
  );
}
