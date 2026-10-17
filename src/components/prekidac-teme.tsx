"use client";

import { Moon, Sun } from "@phosphor-icons/react";

// Switches between light and dark colors and remembers the choice in this browser.
// Both icons are drawn; CSS shows the one that fits, so the server and browser render the same.
export function PrekidacTeme({ mali = false, naTamnom = false }: { mali?: boolean; naTamnom?: boolean }) {
  function promeni() {
    const koren = document.documentElement;
    const sada = koren.getAttribute("data-tema") ?? "svetla";
    const nova = sada === "tamna" ? "svetla" : "tamna";
    koren.setAttribute("data-tema", nova);
    try {
      localStorage.setItem("izabrana-tema", nova);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={promeni}
      aria-label="Promeni temu"
      className={`group inline-flex h-11 items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition-[background-color,transform] duration-300 ease-glatko active:scale-[0.97] ${
        mali ? "w-11" : "w-full justify-start px-4"
      } ${naTamnom ? "text-night-ink/80 hover:bg-white/10 hover:text-night-ink" : "bg-surface text-ink shadow-meko ring-1 ring-line hover:bg-surface2"}`}
    >
      <span className="relative h-[19px] w-[19px]">
        <Moon size={19} weight="bold" className="absolute inset-0 transition-transform duration-500 ease-glatko group-hover:-rotate-12 [[data-tema=tamna]_&]:hidden" />
        <Sun size={19} weight="bold" className="absolute inset-0 hidden transition-transform duration-500 ease-glatko group-hover:rotate-45 [[data-tema=tamna]_&]:block" />
      </span>
      {!mali && <span>Tema</span>}
    </button>
  );
}
