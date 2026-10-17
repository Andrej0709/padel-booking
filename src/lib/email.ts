// Sends emails (account confirmation, password reset).
// No email service is connected yet, so in development the message is printed in the
// server log instead. Look for "[EMAIL]" in the terminal running `npm run dev`.
export async function posaljiEmail(poruka: { kome: string; naslov: string; tekst: string; link: string }) {
  if (process.env.NODE_ENV === "production") {
    // Refuse to pretend: in production a missing email service must be visible.
    throw new Error("Servis za slanje emaila nije podešen.");
  }
  console.log(
    `\n[EMAIL] Za: ${poruka.kome}\n[EMAIL] Naslov: ${poruka.naslov}\n[EMAIL] ${poruka.tekst}\n[EMAIL] Link: ${poruka.link}\n`,
  );
}
