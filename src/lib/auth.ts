import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { korisnici, naciniPrijave, sesije, verifikacije } from "@/db/schema";
import { posaljiEmail } from "@/lib/email";

// Login for owners, reception and players: email and password, or Google.
// See decisions 009 and 010.
const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account" as const,
        },
      }
    : undefined;

export const googleUkljucen = !!google;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: korisnici, session: sesije, account: naciniPrijave, verification: verifikacije },
  }),
  emailAndPassword: {
    enabled: true,
    // An unconfirmed email could belong to someone else. Owner access is granted by email,
    // so nobody may log in before proving the address is theirs.
    requireEmailVerification: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await posaljiEmail({
        kome: user.email,
        naslov: "Nova lozinka",
        tekst: "Klikni na link da postaviš novu lozinku. Link važi sat vremena.",
        link: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await posaljiEmail({
        kome: user.email,
        naslov: "Potvrdi email",
        tekst: "Klikni na link da potvrdiš email i uđeš na sajt.",
        link: url,
      });
    },
  },
  socialProviders: google,
  user: {
    additionalFields: {
      telefon: { type: "string", required: false, input: false },
    },
  },
  session: {
    // Stay logged in for 30 days, renewed once a day while in use.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  telemetry: { enabled: false },
  // Must stay last: lets Server Actions set the login cookie.
  plugins: [nextCookies()],
});
