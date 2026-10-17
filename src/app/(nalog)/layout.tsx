import Link from "next/link";
import { Znak } from "@/components/znak";
import { PrekidacTeme } from "@/components/prekidac-teme";

// Shared frame for login, sign-up and password pages.
export default function NalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Znak velicina={32} />
          <span className="font-naslov text-lg font-bold">padel-booking</span>
        </Link>
        <PrekidacTeme mali />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-[420px] rounded-[18px] bg-surface p-6 shadow-[0_0_0_1px_var(--line),0_24px_64px_rgba(10,20,50,.08)] sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
