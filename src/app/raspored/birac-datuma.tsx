"use client";

import { useRouter } from "next/navigation";

export function BiracDatuma({ datum }: { datum: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      aria-label="Izaberi datum"
      className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
      value={datum}
      onChange={(e) => e.target.value && router.push(`/raspored?datum=${e.target.value}`)}
    />
  );
}
