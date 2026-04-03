import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CineCompara Chile — Compará precios de cine",
  description: "Compará precios y horarios de las 4 grandes cadenas de cine en Chile: Cinemark, Cinépolis, Cineplanet y Muvix. Ve tus precios con descuento según tu banco u operador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full" style={{ backgroundColor: "#332f37", fontFamily: "var(--font-montserrat, Montserrat, sans-serif)" }}>
        {children}
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
