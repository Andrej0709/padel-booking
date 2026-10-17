// The logo: a court seen from above. Blue surface, white net line, lime ball.
export function Znak({ velicina = 36, tamniji = false }: { velicina?: number; tamniji?: boolean }) {
  const r = Math.round(velicina * 0.28);
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block flex-none overflow-hidden ${tamniji ? "bg-brand-deep" : "bg-brand"}`}
      style={{ width: velicina, height: velicina, borderRadius: r }}
    >
      <span
        className="absolute inset-x-0 bg-white/90"
        style={{ top: velicina / 2 - 1, height: Math.max(2, velicina / 18) }}
      />
      <span
        className="absolute rounded-full bg-lime"
        style={{
          width: velicina / 3,
          height: velicina / 3,
          right: velicina * 0.16,
          bottom: velicina * 0.13,
        }}
      />
    </span>
  );
}
