"use client";

import { useState, useTransition } from "react";
import { ukloniClana } from "./actions";

export function DugmeUkloni({ id, ime }: { id: string; ime: string }) {
  const [potvrda, setPotvrda] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, startTransition] = useTransition();

  if (!potvrda) {
    return (
      <button
        type="button"
        onClick={() => setPotvrda(true)}
        className="h-9 rounded-lg px-3 text-sm font-bold text-danger hover:bg-ns-bg"
      >
        Ukloni
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-sm font-semibold">Ukloniti {ime}?</span>
      <button type="button" onClick={() => setPotvrda(false)} className="h-9 rounded-lg border border-line px-3 text-sm font-semibold">
        Ne
      </button>
      <button
        type="button"
        disabled={salje}
        onClick={() =>
          startTransition(async () => {
            const r = await ukloniClana(id);
            if (r.greska) setGreska(r.greska);
          })
        }
        className="h-9 rounded-lg bg-danger px-3 text-sm font-bold text-white disabled:opacity-60"
      >
        Da
      </button>
      {greska && <span className="text-sm text-danger">{greska}</span>}
    </span>
  );
}
