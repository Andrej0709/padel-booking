import type { Metadata } from "next";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const barlowSemi = Barlow_Semi_Condensed({
  variable: "--font-barlow-semi",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: { default: "padel-booking", template: "%s · padel-booking" },
  description: "Rezervacija padel terena",
};

// Applies the saved theme before the first paint, so the page never flashes the wrong colors.
const temaSkripta = `(function(){try{var t=localStorage.getItem("tema");if(t)document.documentElement.setAttribute("data-tema",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr"
      className={`${barlow.variable} ${barlowSemi.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaSkripta }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
