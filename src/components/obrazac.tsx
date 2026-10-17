"use client";

import { useActionState } from "react";

type Stanje = { poruka?: string; greska?: string };

// A form that runs a Server Action and shows its answer ("Sačuvano." or an error) under the button.
export function Obrazac({
  akcija,
  children,
  dugme,
  className = "",
}: {
  akcija: (prethodno: Stanje, podaci: FormData) => Promise<Stanje>;
  children: React.ReactNode;
  dugme: string;
  className?: string;
}) {
  const [stanje, posalji, salje] = useActionState(akcija, {});
  return (
    <form action={posalji} className={`flex flex-col gap-4 ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={salje}
          className="h-12 rounded-full bg-brand px-6 text-[15px] font-bold text-white shadow-[0_8px_24px_-10px_var(--brand)] transition-[transform,filter] duration-300 ease-glatko hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
        >
          {salje ? "Čuvam…" : dugme}
        </button>
        {stanje.poruka && !salje && (
          <span role="status" className="text-sm font-semibold text-played-fg">
            {stanje.poruka}
          </span>
        )}
        {stanje.greska && !salje && (
          <span role="alert" className="text-sm font-semibold text-danger">
            {stanje.greska}
          </span>
        )}
      </div>
    </form>
  );
}
