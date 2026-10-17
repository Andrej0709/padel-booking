"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, TennisBall, UserCircle } from "@phosphor-icons/react";

const STAVKE = [
  { naziv: "Rezerviši", href: "/", aktivno: (p: string) => p.startsWith("/k/"), Ikona: TennisBall },
  { naziv: "Moji termini", href: "/moje-rezervacije", aktivno: (p: string) => p.startsWith("/moje-rezervacije"), Ikona: CalendarCheck },
  { naziv: "Profil", href: "/profil", aktivno: (p: string) => p.startsWith("/profil"), Ikona: UserCircle },
];

// Player menu. Phone: tabs at the bottom of the screen, like an app. Computer: links in the top bar.
export function DonjaTraka() {
  return <DonjaTrakaZa putanja={usePathname()} />;
}

// Same menu without knowing the current page, shown for a moment while the page streams in.
export function DonjaTrakaZa({ putanja }: { putanja: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line/70 bg-staklo px-1 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 backdrop-blur-xl lg:hidden">
      {STAVKE.map(({ naziv, href, aktivno, Ikona }) => {
        const jeste = aktivno(putanja);
        return (
          <Link
            key={href}
            href={href}
            aria-current={jeste ? "page" : undefined}
            className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${jeste ? "text-brand" : "text-muted"}`}
          >
            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-glatko ${jeste ? "bg-hover" : ""}`}>
              <Ikona size={21} weight={jeste ? "fill" : "regular"} />
            </span>
            {naziv}
          </Link>
        );
      })}
    </nav>
  );
}

export function GornjiLinkovi() {
  return <GornjiLinkoviZa putanja={usePathname()} />;
}

export function GornjiLinkoviZa({ putanja }: { putanja: string }) {
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {STAVKE.map(({ naziv, href, aktivno }) => {
        const jeste = aktivno(putanja);
        return (
          <Link
            key={href}
            href={href}
            aria-current={jeste ? "page" : undefined}
            className={`flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors duration-300 ease-glatko ${
              jeste ? "bg-ink text-surface" : "text-muted hover:bg-surface2 hover:text-ink"
            }`}
          >
            {naziv}
          </Link>
        );
      })}
    </nav>
  );
}
