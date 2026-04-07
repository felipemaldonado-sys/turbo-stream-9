/**
 * Tipos de fuente de vídeo.
 * - hls: reproducible en navegador con hls.js (o Safari nativo).
 * - mjpeg: stream MJPEG en <img> si la URL es accesible (CORS puede bloquear).
 * - iframe: página o embed incrustable (p. ej. visor del fabricante).
 * - rtsp: el navegador NO reproduce RTSP; hace falta conversión a HLS/WebRTC en servidor/gateway.
 * - unknown: tratar como HLS por defecto o mostrar aviso.
 */
export type StreamType = "hls" | "rtsp" | "mjpeg" | "iframe" | "unknown";

/** Registro completo (solo backend / admin). Incluye sourceUrl. */
export type CameraRecord = {
  id: string;
  name: string;
  sourceUrl: string;
  /**
   * Si existe, la cámara publica a `rtmp://…/live/{ingestKey}` y el visor reproduce el HLS generado.
   * `sourceUrl` puede quedar vacío para estas cámaras.
   */
  ingestKey?: string;
  isActive: boolean;
  order: number;
  description?: string;
  thumbnail?: string;
  streamType: StreamType;
  createdAt: string;
  updatedAt: string;
};

/** Lista pública: sin URLs ni datos sensibles. */
export type PublicCamera = {
  id: string;
  name: string;
  order: number;
  description?: string;
  thumbnail?: string;
  streamType: StreamType;
};

/** Payload para crear/actualizar desde admin. */
export type CameraInput = {
  name: string;
  sourceUrl: string;
  isActive: boolean;
  order: number;
  description?: string;
  thumbnail?: string;
  streamType: StreamType;
  /** Solo crear: genera ingestKey y usa HLS del servidor RTMP (sin URL de fuente manual). */
  useRtmpIngest?: boolean;
};

export type PlaybackPayload = {
  /** URL interna de reproducción; no mostrar en UI pública como texto. */
  playbackUrl: string;
  streamType: StreamType;
  /** Si viene informado, el cliente usa el SDK de Twitch (mismo enfoque que `script.js`). */
  twitchChannel?: string;
};
