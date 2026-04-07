/**
 * Servidor RTMP + salida HLS vía FFmpeg (node-media-server v2).
 * Requisito: `ffmpeg` en PATH (macOS: brew install ffmpeg).
 *
 * Publicar: rtmp://127.0.0.1:1935/live/TU_CLAVE
 * Reproducir HLS: http://127.0.0.1:8000/live/TU_CLAVE/index.m3u8
 */

const path = require("path");
const NodeMediaServer = require("node-media-server");

const root = path.join(__dirname, "..");
const mediaRoot = path.join(root, "media");

const rtmpPort = Number(process.env.RTMP_PORT || 1935);
const httpPort = Number(process.env.HTTP_MEDIA_PORT || 8000);
const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

const config = {
  logType: 2,
  rtmp: {
    port: rtmpPort,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: httpPort,
    mediaroot: mediaRoot,
    allow_origin: "*",
  },
  trans: {
    ffmpeg: ffmpegPath,
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=6:hls_flags=delete_segments+append_list]",
        dash: false,
      },
    ],
  },
};

// eslint-disable-next-line no-console -- script de proceso
console.log(
  `[media-server] RTMP publicación: rtmp://127.0.0.1:${rtmpPort}/live/<clave>\n` +
    `[media-server] HLS HTTP: http://127.0.0.1:${httpPort}/live/<clave>/index.m3u8\n` +
    `[media-server] FFmpeg: ${ffmpegPath}`
);

const nms = new NodeMediaServer(config);
nms.run();
