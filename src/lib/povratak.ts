// Where to go after login. Only paths inside this site are allowed,
// so a link like /prijava?nazad=https://evil.example cannot send people elsewhere.
export function bezbedanPovratak(nazad: unknown, podrazumevano = "/") {
  return typeof nazad === "string" && nazad.startsWith("/") && !nazad.startsWith("//") ? nazad : podrazumevano;
}
