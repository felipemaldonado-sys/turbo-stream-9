import { NextResponse } from "next/server";
import { importCameras } from "@/lib/cameras-store";

/**
 * POST: reemplaza todas las cámaras con un JSON guardado (p. ej. copia local del navegador).
 * Útil cuando el servidor no puede persistir en disco (Vercel) o tras un refresh antes de que acabe el write.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const body = json as { cameras?: unknown };
  if (!body || !Array.isArray(body.cameras)) {
    return NextResponse.json({ error: "Se espera { cameras: [...] }" }, { status: 400 });
  }
  try {
    const result = await importCameras(body.cameras);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[api/cameras/restore]", e);
    return NextResponse.json({ error: "No se pudo restaurar" }, { status: 500 });
  }
}
