"use client";

// Switches between light and dark colors and remembers the choice in this browser.
export function PrekidacTeme({ mali = false }: { mali?: boolean }) {
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface2 font-semibold text-ink ${mali ? "h-11 w-11" : "h-10 px-3 text-[13px]"}`}
    >
      <span className="h-3 w-3 rounded-full bg-ink" />
      {!mali && <span>Tema</span>}
    </button>
  );
}
