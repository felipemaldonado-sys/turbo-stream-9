import { NextResponse } from "next/server";
import {
  deleteCamera,
  enableRtmpRelay,
  getCameraById,
  rotateIngestKey,
  updateCamera,
} from "@/lib/cameras-store";
import type { CameraInput, StreamType } from "@/lib/types/camera";

const STREAM_TYPES: StreamType[] = ["hls", "rtsp", "mjpeg", "iframe", "unknown"];

type Params = { params: Promise<{ id: string }> };

function parsePartial(body: unknown): Partial<CameraInput> | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const out: Partial<CameraInput> = {};
  if (typeof o.name === "string") out.name = o.name;
  if (typeof o.sourceUrl === "string") out.sourceUrl = o.sourceUrl;
  if (typeof o.isActive === "boolean") out.isActive = o.isActive;
  if (o.order !== undefined) {
    const n = typeof o.order === "number" ? o.order : parseInt(String(o.order), 10);
    if (Number.isFinite(n)) out.order = n;
  }
  if (typeof o.description === "string") out.description = o.description;
  if (typeof o.thumbnail === "string") out.thumbnail = o.thumbnail;
  if (typeof o.streamType === "string" && STREAM_TYPES.includes(o.streamType as StreamType)) {
    out.streamType = o.streamType as StreamType;
  }
  return out;
}

/**
 * GET una cámara (admin).
 * TODO: restringir a administrador autenticado.
 */
export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const c = await getCameraById(id);
  if (!c) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(c);
}

export async function PUT(request: Request, context: Params) {
  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};

  if (o.enableRtmpRelay === true) {
    const enabled = await enableRtmpRelay(id);
    if (!enabled) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  if (o.rotateIngestKey === true) {
    const rotated = await rotateIngestKey(id);
    if (!rotated) {
      return NextResponse.json(
        { error: "Esta cámara no tiene relay RTMP activo" },
        { status: 400 }
      );
    }
  }

  const partial = parsePartial(json);
  const hasPartial = partial && Object.keys(partial).length > 0;
  if (hasPartial) {
    const updated = await updateCamera(id, partial);
    if (!updated) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json(updated);
  }

  const didRelay = o.enableRtmpRelay === true;
  const didRotate = o.rotateIngestKey === true;
  if (!didRelay && !didRotate) {
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 });
  }

  const c = await getCameraById(id);
  if (!c) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(c);
}

export async function DELETE(_request: Request, context: Params) {
  const { id } = await context.params;
  const ok = await deleteCamera(id);
  if (!ok) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
