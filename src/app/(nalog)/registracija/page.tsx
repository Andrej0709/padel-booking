import { Suspense } from "react";
import { googleUkljucen } from "@/lib/auth";
import { bezbedanPovratak } from "@/lib/povratak";
import { ObrazacRegistracije } from "./obrazac";

export const metadata = { title: "Novi nalog" };

export default function Page({ searchParams }: PageProps<"/registracija">) {
  return (
    <Suspense>
      <Sadrzaj searchParams={searchParams} />
    </Suspense>
  );
}

async function Sadrzaj({ searchParams }: Pick<PageProps<"/registracija">, "searchParams">) {
  const { nazad } = await searchParams;
  return <ObrazacRegistracije povratak={bezbedanPovratak(nazad)} google={googleUkljucen} />;
}
