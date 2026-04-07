import { NextResponse } from "next/server";
import { createCamera, listCameras } from "@/lib/cameras-store";
import { getMediaEndpoints } from "@/lib/media-config";
import type { CameraInput, StreamType } from "@/lib/types/camera";

const STREAM_TYPES: StreamType[] = ["hls", "rtsp", "mjpeg", "iframe", "unknown"];

function parseBody(body: unknown): CameraInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : "";
  const sourceUrl = typeof o.sourceUrl === "string" ? o.sourceUrl : "";
  const isActive = typeof o.isActive === "boolean" ? o.isActive : true;
  const order = typeof o.order === "number" ? o.order : parseInt(String(o.order ?? "0"), 10) || 0;
  const description = typeof o.description === "string" ? o.description : undefined;
  const thumbnail = typeof o.thumbnail === "string" ? o.thumbnail : undefined;
  const st = o.streamType;
  const streamType =
    typeof st === "string" && STREAM_TYPES.includes(st as StreamType)
      ? (st as StreamType)
      : "unknown";
  const useRtmpIngest = o.useRtmpIngest === true;
  if (!name.trim()) return null;
  if (!useRtmpIngest && !sourceUrl.trim()) return null;
  return {
    name,
    sourceUrl,
    isActive,
    order,
    description,
    thumbnail,
    streamType,
    useRtmpIngest,
  };
}

/**
 * GET: lista completa para admin (incluye sourceUrl).
 * TODO: restringir a sesión de administrador.
 */
export async function GET() {
  try {
    const list = await listCameras();
    return NextResponse.json({ cameras: list, media: getMediaEndpoints() });
  } catch (e) {
    console.error("[api/cameras GET]", e);
    return NextResponse.json(
      { error: "No se pudo leer el almacén de cámaras", cameras: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const input = parseBody(json);
  if (!input) {
    return NextResponse.json(
      { error: "Faltan nombre, o URL de fuente, o activa «Recibir por RTMP»" },
      { status: 400 }
    );
  }
  const created = await createCamera(input);
  return NextResponse.json(created, { status: 201 });
}
