import { randomBytes } from "crypto";

export function newCameraId(): string {
  return randomBytes(8).toString("hex");
}

/** Clave única para publicar en RTMP (`rtmp://…/live/{ingestKey}`). */
export function newIngestKey(): string {
  return randomBytes(12).toString("hex");
}
