import Link from "next/link";
import { Check } from "@phosphor-icons/react/ssr";
import { Znak } from "@/components/znak";
import { PrekidacTeme } from "@/components/prekidac-teme";
import { TerenCrtez } from "@/components/teren-crtez";

// Shared frame for login, sign-up and password pages (decision 013).
// Computer: the form on the left, a night blue panel with the court on the right.
export default function NalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Znak velicina={34} />
            <span className="font-naslov text-lg font-bold">padel-booking</span>
          </Link>
          <PrekidacTeme mali />
        </header>
        <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
          <div className="iskoci w-full max-w-[420px] rounded-[30px] bg-surface2 p-1.5 ring-1 ring-line/70">
            <div className="rounded-[25px] bg-surface p-6 shadow-kartica sm:p-8">{children}</div>
          </div>
        </main>
      </div>
      <aside className="nocno-nebo relative m-3 hidden flex-col justify-between overflow-hidden rounded-[34px] p-10 lg:flex">
        <span className="inline-flex w-max items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lime ring-1 ring-white/10">
          <span className="puls h-1.5 w-1.5 rounded-full bg-lime" /> Online rezervacija
        </span>
        <div className="ulaz mx-auto w-full max-w-[520px]">
          <TerenCrtez className="w-full -rotate-3 drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)]" />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="font-naslov text-[44px] font-bold leading-[0.95] tracking-[-0.025em]">
            Teren za tri klika.
            <br />
            <span className="text-lime">Bez poziva.</span>
          </h2>
          <ul className="flex flex-col gap-2 text-[15px] text-night-ink/80">
            {["Slobodni termini za narednih 14 dana", "Potvrda odmah, plaćanje u klubu", "Otkazivanje do 12 sati pre termina"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime/20 text-lime">
                  <Check size={13} weight="bold" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
