"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Barra de navegación con <a> nativos (misma pestaña) para que funcionen aunque falle el bundle JS
 * o la caché de Next; en /viewer se oculta para no duplicar el layout del visor.
 */
/* eslint-disable @next/next/no-html-link-for-pages -- enlaces nativos = navegación completa sin depender del chunk JS */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/viewer" || pathname?.startsWith("/viewer/");

  return (
    <>
      {!hideNav && (
        <nav
          className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] bg-[#07080c]/95 px-4 py-2 text-sm backdrop-blur"
          aria-label="Navegación principal"
        >
          <a href="/" className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100">
            Inicio
          </a>
          <a
            href="/viewer"
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
          >
            Visor
          </a>
          <a
            href="/admin"
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
          >
            Admin
          </a>
          <span className="ml-auto text-[11px] text-zinc-600">
            Mismo puerto que la terminal (p. ej. <code className="text-zinc-500">:3333</code>)
          </span>
        </nav>
      )}
      {children}
    </>
  );
}
