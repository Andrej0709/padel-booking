"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authKlijent } from "@/lib/auth-klijent";
import { dugmeGlavno, greska as greskaKlasa, naslov, oznaka, polje } from "@/components/ui";
import { GoogleDugme } from "../google-dugme";

export function ObrazacPrijave({
  povratak,
  google,
  potvrdjeno,
}: {
  povratak: string;
  google: boolean;
  potvrdjeno: boolean;
}) {
  const router = useRouter();
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);

  async function posalji(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const podaci = new FormData(e.currentTarget);
    setSalje(true);
    setGreska(null);
    const { error } = await authKlijent.signIn.email({
      email: String(podaci.get("email")),
      password: String(podaci.get("lozinka")),
      rememberMe: true,
    });
    setSalje(false);
    if (error) {
      setGreska(
        error.code === "EMAIL_NOT_VERIFIED"
          ? "Email još nije potvrđen. Poslali smo ti ponovo link za potvrdu."
          : error.code === "INVALID_EMAIL_OR_PASSWORD"
            ? "Pogrešan email ili lozinka."
            : "Prijava nije uspela. Pokušaj ponovo.",
      );
      return;
    }
    router.replace(povratak);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className={`${naslov} text-[28px] leading-tight`}>Prijava</h1>
        <p className="mt-1 text-[15px] text-muted">Za igrače i za ljude iz kluba.</p>
      </div>
      {potvrdjeno && (
        <p className="rounded-xl bg-played-bg px-3.5 py-3 text-sm font-semibold text-played-fg">
          Email je potvrđen. Sada se prijavi.
        </p>
      )}
      <GoogleDugme ukljucen={google} povratak={povratak} />
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-line" /> ili emailom <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={posalji} className="flex flex-col gap-4">
        <label>
          <span className={oznaka}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={polje} />
        </label>
        <label>
          <span className={oznaka}>Lozinka</span>
          <input name="lozinka" type="password" required autoComplete="current-password" className={polje} />
        </label>
        {greska && (
          <p role="alert" className={greskaKlasa}>
            {greska}
          </p>
        )}
        <button type="submit" disabled={salje} className={dugmeGlavno}>
          {salje ? "Prijavljujem…" : "Prijavi se"}
        </button>
      </form>
      <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
        <Link href="/zaboravljena-lozinka" className="text-brand">
          Zaboravljena lozinka
        </Link>
        <Link href={`/registracija?nazad=${encodeURIComponent(povratak)}`} className="text-brand">
          Napravi nalog
        </Link>
      </div>
    </div>
  );
}
