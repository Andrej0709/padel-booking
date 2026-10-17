"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { authKlijent } from "@/lib/auth-klijent";

export function Odjava({ kuda = "/prijava", naTamnom = false, siroko = false }: { kuda?: string; naTamnom?: boolean; siroko?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authKlijent.signOut();
        router.replace(kuda);
        router.refresh();
      }}
      aria-label="Odjavi se"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-[background-color,transform] duration-300 ease-glatko active:scale-[0.97] ${
        siroko ? "w-full justify-start px-4" : "w-11"
      } ${naTamnom ? "text-night-ink/80 hover:bg-white/10 hover:text-night-ink" : "bg-surface text-ink shadow-meko ring-1 ring-line hover:bg-surface2"}`}
    >
      <SignOut size={19} weight="bold" />
      {siroko && <span>Odjavi se</span>}
    </button>
  );
}
