/**
 * URLs públicas del servidor RTMP/HLS (debe coincidir con `npm run media-server` y DNS/IP).
 * Usado solo en servidor (rutas API / playback).
 *
 * Prioridad RTMP:
 * 1. MEDIA_RTMP_PUBLIC_URL (URL completa, ej. rtmp://live.tudominio.co:1935)
 * 2. MEDIA_RTMP_HOST (solo host, ej. live.tudominio.co → rtmp://live.tudominio.co:1935)
 * 3. Por defecto localhost
 *
 * Prioridad HLS:
 * 1. MEDIA_HLS_PUBLIC_BASE_URL
 * 2. MEDIA_HLS_HOST → https://HOST (o http si MEDIA_HLS_USE_HTTP=1)
 * 3. Por defecto localhost:8000
 */

const DEFAULT_RTMP_ROOT = "rtmp://127.0.0.1:1935";
const DEFAULT_HLS_BASE = "http://127.0.0.1:8000";

export type MediaEndpoints = {
  /** rtmp://host:1935 (sin app / stream) */
  rtmpRoot: string;
  /** rtmp://host:1935/live — publicar aquí + /{ingestKey} */
  rtmpPublishBase: string;
  /** Origen HTTP donde NMS sirve /live/.../index.m3u8 */
  hlsBase: string;
};

function resolveRtmpRoot(): string {
  const full = process.env.MEDIA_RTMP_PUBLIC_URL?.trim();
  if (full) return full.replace(/\/$/, "");
  const host = process.env.MEDIA_RTMP_HOST?.trim();
  if (host) {
    const h = host.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").split("@").pop()!;
    return `rtmp://${h}:1935`;
  }
  return DEFAULT_RTMP_ROOT;
}

function resolveHlsBase(): string {
  const full = process.env.MEDIA_HLS_PUBLIC_BASE_URL?.trim();
  if (full) return full.replace(/\/$/, "");
  const host = process.env.MEDIA_HLS_HOST?.trim();
  if (host) {
    const h = host.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    const useHttp = process.env.MEDIA_HLS_USE_HTTP === "1" || process.env.MEDIA_HLS_USE_HTTP === "true";
    return `${useHttp ? "http" : "https"}://${h}`;
  }
  return DEFAULT_HLS_BASE;
}

export function getMediaEndpoints(): MediaEndpoints {
  const rtmpRoot = resolveRtmpRoot();
  const hlsBase = resolveHlsBase();
  const rtmpPublishBase = `${rtmpRoot}/live`;
  return { rtmpRoot, rtmpPublishBase, hlsBase };
}

/** URL HLS que reproducirá el visor cuando la cámara usa relay RTMP→HLS. */
export function relayHlsPlaybackUrl(ingestKey: string): string {
  const { hlsBase } = getMediaEndpoints();
  return `${hlsBase}/live/${ingestKey}/index.m3u8`;
}

export function rtmpPublishUrl(ingestKey: string): string {
  const { rtmpPublishBase } = getMediaEndpoints();
  return `${rtmpPublishBase}/${ingestKey}`;
}
