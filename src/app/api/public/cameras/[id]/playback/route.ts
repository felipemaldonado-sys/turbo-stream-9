import { NextResponse } from "next/server";
import { buildPlaybackPayload } from "@/lib/camera-playback";
import { getCameraById } from "@/lib/cameras-store";

type Params = { params: Promise<{ id: string }> };

/** Evita que el bundler intente estáticos inconsistentes con `[id]` en dev. */
export const dynamic = "force-dynamic";

/**
 * Devuelve la URL de reproducción y el tipo de stream para el reproductor.
 * No incluye credenciales en la lista pública, pero esta URL sigue siendo sensible:
 * en producción usar URLs firmadas de corta duración o proxy en tu red.
 *
 * RTSP: el navegador no reproduce RTSP; devolvemos la URL igualmente y el cliente muestra aviso.
 */
export async function GET(request: Request, context: Params) {
  const { id } = await context.params;
  const c = await getCameraById(id);
  if (!c || !c.isActive) {
    return NextResponse.json({ error: "Cámara no disponible" }, { status: 404 });
  }
  const body = buildPlaybackPayload(c, request);
  return NextResponse.json(body);
}
