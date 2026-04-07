import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Visor de cámaras IP",
  description: "Visualización pública y panel de administración de cámaras",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} min-h-screen bg-[#07080c] font-sans antialiased`}>
        <noscript>
          <div
            style={{
              padding: "2rem",
              fontFamily: "system-ui, sans-serif",
              background: "#07080c",
              color: "#fff",
              minHeight: "100vh",
            }}
          >
            <p style={{ fontWeight: 600 }}>Activa JavaScript</p>
            <p style={{ marginTop: "0.5rem", opacity: 0.75, fontSize: "0.9rem" }}>
              Esta aplicación necesita JavaScript. Con <code>npm run dev</code> abre la URL que muestra la
              terminal (suele ser <strong>http://localhost:3000</strong> u otro puerto si 3000 está ocupado).
            </p>
          </div>
        </noscript>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
