import { NextResponse } from "next/server";
import { buildPlaybackPayload } from "@/lib/camera-playback";
import { getCameraById } from "@/lib/cameras-store";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/**
 * Vista previa en el panel admin: misma señal que el visor, pero **sin** exigir `isActive`.
 * En producción conviene proteger /admin (auth); si no, cualquiera con la URL podría ver fuentes inactivas.
 */
export async function GET(request: Request, context: Params) {
  const { id } = await context.params;
  const c = await getCameraById(id);
  if (!c) {
    return NextResponse.json({ error: "Cámara no encontrada" }, { status: 404 });
  }
  const body = buildPlaybackPayload(c, request);
  return NextResponse.json(body);
}
