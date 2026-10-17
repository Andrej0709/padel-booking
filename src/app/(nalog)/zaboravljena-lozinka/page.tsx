"use client";

import Link from "next/link";
import { useState } from "react";
import { authKlijent } from "@/lib/auth-klijent";
import { dugmeGlavno, naslov, oznaka, polje } from "@/components/ui";

export default function Page() {
  const [poslato, setPoslato] = useState(false);
  const [salje, setSalje] = useState(false);

  async function posalji(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalje(true);
    await authKlijent.requestPasswordReset({
      email: String(new FormData(e.currentTarget).get("email")),
      redirectTo: "/nova-lozinka",
    });
    setSalje(false);
    // Same message whether or not the email exists, so nobody can test which emails have accounts.
    setPoslato(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className={`${naslov} text-[28px] leading-tight`}>Zaboravljena lozinka</h1>
      {poslato ? (
        <p className="text-[15px] leading-relaxed text-muted">
          Ako nalog sa tim emailom postoji, poslali smo link za novu lozinku. Link važi sat vremena.
        </p>
      ) : (
        <form onSubmit={posalji} className="flex flex-col gap-4">
          <p className="text-[15px] text-muted">Upiši email naloga. Poslaćemo ti link za novu lozinku.</p>
          <label>
            <span className={oznaka}>Email</span>
            <input name="email" type="email" required autoComplete="email" className={polje} />
          </label>
          <button type="submit" disabled={salje} className={dugmeGlavno}>
            {salje ? "Šaljem…" : "Pošalji link"}
          </button>
        </form>
      )}
      <Link href="/prijava" className="text-sm font-semibold text-brand">
        ← Nazad na prijavu
      </Link>
    </div>
  );
}
