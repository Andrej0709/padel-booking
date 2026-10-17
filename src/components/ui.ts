// Shared class names, so buttons, fields and cards look the same on every page.
// Pill buttons that press in slightly, soft shadows instead of hard lines (decision 013).
const pritisak = "transition-[transform,background-color,box-shadow,filter] duration-300 ease-glatko active:scale-[0.97]";

export const dugme = `inline-flex h-11 items-center justify-center gap-2 rounded-full bg-surface px-5 text-[15px] font-semibold text-ink shadow-meko ring-1 ring-line hover:bg-surface2 disabled:opacity-60 ${pritisak}`;
export const dugmeGlavno = `group inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-bold text-white shadow-[0_8px_24px_-8px_var(--brand)] hover:brightness-110 disabled:opacity-60 ${pritisak}`;
export const dugmeLimeta = `group inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-lime px-6 text-[17px] font-bold text-lime-ink shadow-[0_10px_30px_-10px_oklch(0.75_0.2_125)] hover:brightness-105 disabled:opacity-60 ${pritisak}`;
// The small circle with an arrow inside a big button. It slides a little on hover.
export const strelicaUDugmetu =
  "flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 ease-glatko group-hover:translate-x-0.5";
export const polje =
  "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base font-medium text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_4px_var(--hover)]";
export const oznaka = "mb-1.5 block text-[13px] font-semibold text-muted";
export const kartica = "rounded-[22px] bg-surface shadow-kartica ring-1 ring-line/60";
export const naslov = "font-naslov font-bold tracking-[-0.015em]";
// Small pill above a heading: "PREGLED", "TVOJ TERMIN".
export const natpis =
  "inline-flex w-max items-center gap-1.5 rounded-full bg-hover px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand";
export const greska =
  "flex items-start gap-2.5 rounded-2xl bg-ns-bg px-4 py-3 text-sm font-semibold leading-snug text-ns-fg";
export const cip = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold";
