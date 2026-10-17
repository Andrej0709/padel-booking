"use client";

import { useTransition } from "react";
import { blokirajNalog } from "../../actions";

export function DugmeBlokade({ korisnikId, blokiran }: { korisnikId: string; blokiran: boolean }) {
  const [salje, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={salje}
      onClick={() => startTransition(() => blokirajNalog(korisnikId, !blokiran))}
      className={`h-9 rounded-lg px-3 text-sm font-bold disabled:opacity-60 ${
        blokiran ? "bg-ns-bg text-ns-fg" : "border border-line bg-surface text-ink"
      }`}
    >
      {blokiran ? "Blokiran · odblokiraj" : "Blokiraj online"}
    </button>
  );
}
