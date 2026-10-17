"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authKlijent } from "@/lib/auth-klijent";
import { dugmeGlavno, greska as greskaKlasa, naslov, oznaka, polje } from "@/components/ui";

export default function Page() {
  return (
    <Suspense>
      <Obrazac />
    </Suspense>
  );
}

function Obrazac() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);

  async function posalji(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setSalje(true);
    const { error } = await authKlijent.resetPassword({
      newPassword: String(new FormData(e.currentTarget).get("lozinka")),
      token,
    });
    setSalje(false);
    if (error) {
      setGreska("Link je istekao ili je već iskorišćen. Zatraži novi.");
      return;
    }
    router.replace("/prijava");
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className={`${naslov} text-[28px] leading-tight`}>Link nije ispravan</h1>
        <Link href="/zaboravljena-lozinka" className="text-sm font-semibold text-brand">
          Zatraži novi link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-4">
      <h1 className={`${naslov} text-[28px] leading-tight`}>Nova lozinka</h1>
      <label>
        <span className={oznaka}>Nova lozinka (bar 8 znakova)</span>
        <input name="lozinka" type="password" required minLength={8} autoComplete="new-password" className={polje} />
      </label>
      {greska && (
        <p role="alert" className={greskaKlasa}>
          {greska}
        </p>
      )}
      <button type="submit" disabled={salje} className={dugmeGlavno}>
        {salje ? "Čuvam…" : "Sačuvaj lozinku"}
      </button>
    </form>
  );
}
