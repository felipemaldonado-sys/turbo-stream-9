import { NextResponse } from "next/server";
import { listPublicCameras } from "@/lib/cameras-store";

/**
 * Listado solo de cámaras activas, ordenadas, sin sourceUrl ni datos internos.
 */
export async function GET() {
  try {
    const cameras = await listPublicCameras();
    return NextResponse.json({ cameras });
  } catch (e) {
    console.error("[api/public/cameras GET]", e);
    return NextResponse.json(
      { error: "No se pudo cargar cámaras públicas", cameras: [] },
      { status: 500 }
    );
  }
}
