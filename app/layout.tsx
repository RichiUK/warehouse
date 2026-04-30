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
        <Script id="maze-snippet" strategy="afterInteractive">{`
          (function (m, a, z, e) {
            var s, t, u, v;
            try { t = m.sessionStorage.getItem('maze-us'); } catch (err) {}
            if (!t) {
              t = new Date().getTime();
              try { m.sessionStorage.setItem('maze-us', t); } catch (err) {}
            }
            u = document.currentScript || (function () {
              var w = document.getElementsByTagName('script');
              return w[w.length - 1];
            })();
            v = u && u.nonce;
            s = a.createElement('script');
            s.src = z + '?apiKey=' + e;
            s.async = true;
            if (v) s.setAttribute('nonce', v);
            a.getElementsByTagName('head')[0].appendChild(s);
            m.mazeUniversalSnippetApiKey = e;
          })(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '550b1390-fccc-42b7-9473-aab735e1ff01');
        `}</Script>
      </body>
    </html>
  );
}
