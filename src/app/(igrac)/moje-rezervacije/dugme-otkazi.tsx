"use client";

import { useState, useTransition } from "react";
import { otkaziSvoju } from "./actions";

export function DugmeOtkazi({ id }: { id: string }) {
  const [potvrda, setPotvrda] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, startTransition] = useTransition();

  if (!potvrda) {
    return (
      <button
        type="button"
        onClick={() => setPotvrda(true)}
        className="inline-flex h-11 items-center rounded-full px-4 text-[15px] font-bold text-danger transition-colors duration-300 hover:bg-ns-bg"
      >
        Otkaži termin
      </button>
    );
  }
  return (
    <div className="iskoci flex w-full flex-col gap-2.5 rounded-[20px] bg-ns-bg p-4">
      <div className="font-bold text-ns-fg">Otkazati termin? Teren postaje slobodan za druge.</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPotvrda(false)}
          className="h-[46px] rounded-full bg-surface text-[15px] font-semibold ring-1 ring-line"
        >
          Ne, zadrži
        </button>
        <button
          type="button"
          disabled={salje}
          onClick={() =>
            startTransition(async () => {
              const r = await otkaziSvoju(id);
              if (r.greska) setGreska(r.greska);
            })
          }
          className="h-[46px] rounded-full bg-danger text-[15px] font-bold text-white disabled:opacity-60"
        >
          Da, otkaži
        </button>
      </div>
      {greska && <p className="text-sm font-semibold text-ns-fg">{greska}</p>}
    </div>
  );
}
