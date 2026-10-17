"use client";

import Link from "next/link";
import { useState } from "react";
import { authKlijent } from "@/lib/auth-klijent";
import { dugmeGlavno, greska as greskaKlasa, naslov, oznaka, polje } from "@/components/ui";
import { GoogleDugme } from "../google-dugme";

export function ObrazacRegistracije({ povratak, google }: { povratak: string; google: boolean }) {
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);
  const [poslato, setPoslato] = useState<string | null>(null);

  async function posalji(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const podaci = new FormData(e.currentTarget);
    const email = String(podaci.get("email"));
    setSalje(true);
    setGreska(null);
    const { error } = await authKlijent.signUp.email({
      name: String(podaci.get("ime")).trim(),
      email,
      password: String(podaci.get("lozinka")),
      // After clicking the link in the email, the person is logged in and lands here.
      callbackURL: povratak,
    });
    setSalje(false);
    if (error) {
      setGreska(
        error.code?.startsWith("USER_ALREADY_EXISTS")
          ? "Nalog sa ovim emailom već postoji. Prijavi se ili izaberi zaboravljenu lozinku."
          : error.code === "PASSWORD_TOO_SHORT"
            ? "Lozinka mora imati bar 8 znakova."
            : "Pravljenje naloga nije uspelo. Pokušaj ponovo.",
      );
      return;
    }
    setPoslato(email);
  }

  if (poslato) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lime-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
          </svg>
        </div>
        <h1 className={`${naslov} text-[28px] leading-tight`}>Proveri email</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Poslali smo link za potvrdu na <strong className="text-ink">{poslato}</strong>. Klikni na njega i odmah si
          prijavljen. Link važi sat vremena.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className={`${naslov} text-[28px] leading-tight`}>Novi nalog</h1>
        <p className="mt-1 text-[15px] text-muted">Treba ti za online rezervaciju termina.</p>
      </div>
      <GoogleDugme ukljucen={google} povratak={povratak} />
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-line" /> ili emailom <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={posalji} className="flex flex-col gap-4">
        <label>
          <span className={oznaka}>Ime i prezime</span>
          <input name="ime" required autoComplete="name" className={polje} />
        </label>
        <label>
          <span className={oznaka}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={polje} />
        </label>
        <label>
          <span className={oznaka}>Lozinka (bar 8 znakova)</span>
          <input name="lozinka" type="password" required minLength={8} autoComplete="new-password" className={polje} />
        </label>
        {greska && (
          <p role="alert" className={greskaKlasa}>
            {greska}
          </p>
        )}
        <button type="submit" disabled={salje} className={dugmeGlavno}>
          {salje ? "Pravim nalog…" : "Napravi nalog"}
        </button>
      </form>
      <p className="text-sm font-semibold text-muted">
        Već imaš nalog?{" "}
        <Link href={`/prijava?nazad=${encodeURIComponent(povratak)}`} className="text-brand">
          Prijavi se
        </Link>
      </p>
    </div>
  );
}
