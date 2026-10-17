import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { zahtevajClana } from "@/lib/pristup";
import { ucitajProfil, type RezervacijaIgraca } from "@/lib/igraci";
import { dinari, kratkiDatum, lepTelefon, mnozina } from "@/lib/format";
import { kartica, naslov } from "@/components/ui";
import { VlasnikOkvir } from "../../okvir";
import { DugmeBlokade } from "./dugme-blokade";

export const metadata = { title: "Profil igrača" };

export default function Page({ params }: PageProps<"/vlasnik/igraci/[id]">) {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Učitavam profil…</p>}>
      <Profil params={params} />
    </Suspense>
  );
}

const STATUS: Record<RezervacijaIgraca["status"], [string, string]> = {
  potvrdjena: ["Potvrđena", "bg-conf-bg text-conf-fg"],
  odigrana: ["Odigrana", "bg-played-bg text-played-fg"],
  nedolazak: ["Nije došao", "bg-ns-bg text-ns-fg"],
  otkazana: ["Otkazana", "bg-surface2 text-muted"],
};

async function Profil({ params }: Pick<PageProps<"/vlasnik/igraci/[id]">, "params">) {
  const { id } = await params;
  const clan = await zahtevajClana(`/vlasnik/igraci/${id}`);
  const profil = await ucitajProfil(clan.klub.id, clan.klub.vremenskaZona, id);
  if (!profil) notFound();

  const vazece = profil.rezervacije.filter((r) => r.status !== "otkazana");
  const nedolasci = vazece.filter((r) => r.status === "nedolazak").length;
  const predstojece = profil.rezervacije.filter((r) => r.buduca && r.status !== "otkazana").reverse();
  const prosle = profil.rezervacije.filter((r) => !r.buduca || r.status === "otkazana");

  return (
    <VlasnikOkvir clan={clan} aktivno="igraci">
      <div className="flex items-center gap-3.5 border-b border-line bg-surface px-3 py-2.5 sm:px-5">
        <Link
          href="/vlasnik/igraci"
          className="flex h-11 items-center gap-1.5 rounded-[10px] border border-line px-3.5 pl-2.5 text-[15px] font-semibold"
        >
          ← Igrači
        </Link>
        <span className={`${naslov} text-xl`}>Profil igrača</span>
      </div>

      <main className="mx-auto grid w-full max-w-[1100px] items-start gap-5 px-4 pb-12 pt-6 sm:px-5 md:grid-cols-[minmax(280px,1fr)_2fr]">
        <aside className="flex flex-col gap-3.5">
          <div className={`${kartica} flex flex-col gap-3.5 p-[22px]`}>
            <div className={`${naslov} text-[40px] leading-none`}>{profil.ime}</div>
            <a
              href={`tel:${profil.telefon}`}
              className="flex h-[52px] items-center justify-between rounded-xl bg-surface2 px-4"
            >
              <span className="text-lg font-bold">{lepTelefon(profil.telefon)}</span>
              <span className="text-sm font-bold text-brand">Pozovi</span>
            </a>
          </div>

          <div
            className={`flex flex-col gap-2 rounded-2xl p-[22px] ${
              nedolasci > 0 ? "bg-ns-bg text-ns-fg" : `${kartica} text-ink`
            }`}
          >
            <div className="text-[13px] font-bold uppercase tracking-[.06em]">Nedolasci</div>
            <div className="flex items-baseline gap-2.5">
              <span className={`${naslov} text-[72px] leading-[.9]`}>{nedolasci}</span>
              <span className="text-lg font-semibold">
                od {vazece.length} {mnozina(vazece.length, "rezervacije", "rezervacije", "rezervacija")}
              </span>
            </div>
            <p className="mt-1 text-[15px] leading-snug">
              {nedolasci === 0
                ? "Igrač je došao na sve termine."
                : `Igrač ${nedolasci === 1 ? "jednom nije došao" : `nije došao ${nedolasci} puta`}. Proveri pre potvrde da li tražiš kaparu za sledeći termin.`}
            </p>
          </div>

          {profil.nalozi.length > 0 && (
            <div className={`${kartica} flex flex-col gap-3 p-[18px]`}>
              <div className="text-[13px] font-bold uppercase tracking-[.06em] text-muted">Online nalozi</div>
              <p className="text-sm text-muted">Nalozi koji su rezervisali online sa ovim brojem.</p>
              {profil.nalozi.map((n) => (
                <div key={n.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-semibold">{n.email}</span>
                  <DugmeBlokade korisnikId={n.id} blokiran={n.blokiran} />
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-col gap-[22px]">
          <Spisak naslovSpiska="Predstojeće" rezervacije={predstojece} prazno="Nema zakazanih termina." />
          <Spisak naslovSpiska="Prošle" rezervacije={prosle} prazno="Nema prošlih rezervacija." />
        </div>
      </main>
    </VlasnikOkvir>
  );
}

function Spisak({
  naslovSpiska,
  rezervacije,
  prazno,
}: {
  naslovSpiska: string;
  rezervacije: RezervacijaIgraca[];
  prazno: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[13px] font-bold uppercase tracking-[.06em] text-muted">{naslovSpiska}</h2>
      {rezervacije.length === 0 && <p className="text-[15px] text-muted">{prazno}</p>}
      {rezervacije.map((r) => (
        <div key={r.id} className={`${kartica} flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-xl px-[18px] py-3.5`}>
          <strong className="min-w-[110px] text-[15px]">{kratkiDatum(r.datum)}</strong>
          <span className="min-w-[95px] font-semibold">
            {r.od}–{r.do}
          </span>
          <span className="min-w-[70px] flex-1 text-muted">{r.teren}</span>
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold ${r.izvor === "online" ? "bg-lime text-lime-ink" : "bg-surface2 text-ink"}`}
          >
            {r.izvor === "online" ? "Online" : "Telefon"}
          </span>
          <span className={`rounded-md px-2 py-1 text-xs font-bold ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
          <span className="min-w-[80px] text-right font-semibold">{dinari(r.cenaRsd)}</span>
        </div>
      ))}
    </section>
  );
}
