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
        className="h-11 self-start rounded-xl px-3 text-[15px] font-bold text-danger hover:bg-ns-bg"
      >
        Otkaži termin
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-ns-bg p-3.5">
      <div className="font-bold text-ns-fg">Otkazati termin? Teren postaje slobodan za druge.</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPotvrda(false)}
          className="h-[46px] rounded-xl border border-line bg-surface text-[15px] font-semibold"
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
          className="h-[46px] rounded-xl bg-danger text-[15px] font-bold text-white disabled:opacity-60"
        >
          Da, otkaži
        </button>
      </div>
      {greska && <p className="text-sm font-semibold text-ns-fg">{greska}</p>}
    </div>
  );
}
