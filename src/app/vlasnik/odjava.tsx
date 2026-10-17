"use client";

import { useRouter } from "next/navigation";
import { authKlijent } from "@/lib/auth-klijent";

export function Odjava({ kuda = "/prijava" }: { kuda?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authKlijent.signOut();
        router.replace(kuda);
        router.refresh();
      }}
      className="h-11 rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold text-ink hover:bg-surface2"
    >
      Odjavi se
    </button>
  );
}
