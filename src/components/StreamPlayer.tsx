"use client";

/**
 * Reproducción según streamType:
 * - hls / unknown: hls.js o HLS nativo (Safari).
 * - mjpeg: <img> (puede fallar por CORS).
 * - iframe: embed (visores del fabricante).
 * - rtsp: no reproducible en navegador; requiere conversión a HLS/WebRTC en servidor.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { TwitchSdkPlayer } from "@/components/TwitchSdkPlayer";
import type { StreamType } from "@/lib/types/camera";

export type PlayerState = "loading" | "playing" | "offline" | "unsupported";

type Props = {
  cameraId: string;
  streamType: StreamType;
  cameraName: string;
  onStateChange?: (s: PlayerState) => void;
  /** p. ej. clase `stream-player-shell` para integrar en layouts personalizados */
  className?: string;
  /**
   * Base de la API de playback. Por defecto visor público.
   * En admin usar `/api/admin/cameras` para previsualizar aunque la cámara esté inactiva en público.
   */
  playbackBasePath?: string;
};

export function StreamPlayer({
  cameraId,
  streamType,
  cameraName,
  onStateChange,
  className = "",
  playbackBasePath = "/api/public/cameras",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const [state, setState] = useState<PlayerState>("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [surface, setSurface] = useState<"video" | "img" | "iframe" | "twitch-sdk" | "none">("none");
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [twitchSdkChannel, setTwitchSdkChannel] = useState<string | null>(null);

  const setPlayerState = useCallback((s: PlayerState, msg?: string | null) => {
    setState(s);
    setDetail(msg ?? null);
    onStateChangeRef.current?.(s);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setPlayerState("loading");
      setSurface("none");
      setIframeSrc(null);
      setImgSrc(null);
      setHlsUrl(null);
      setTwitchSdkChannel(null);

      const res = await fetch(`${playbackBasePath}/${cameraId}/playback`);
      if (cancelled) return;
      if (!res.ok) {
        setPlayerState("offline", "Transmisión no disponible");
        return;
      }
      const data = (await res.json()) as {
        playbackUrl: string;
        streamType: StreamType;
        twitchChannel?: string;
      };
      const url = data.playbackUrl;
      const effective = data.streamType ?? streamType;

      if (effective === "rtsp") {
        setSurface("none");
        setPlayerState(
          "unsupported",
          "RTSP no se reproduce en el navegador. Convierta a HLS o WebRTC en un servidor intermedio."
        );
        return;
      }

      if (data.twitchChannel) {
        setSurface("twitch-sdk");
        setTwitchSdkChannel(data.twitchChannel);
        setPlayerState("loading");
        return;
      }

      if (effective === "iframe") {
        setSurface("iframe");
        setIframeSrc(url);
        setPlayerState("playing");
        return;
      }

      if (effective === "mjpeg") {
        setSurface("img");
        setImgSrc(url);
        setPlayerState("playing");
        return;
      }

      if (effective === "hls" || effective === "unknown") {
        setSurface("video");
        setHlsUrl(url);
        return;
      }

      setPlayerState("unsupported", "Tipo de fuente no soportado en el cliente.");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [cameraId, streamType, setPlayerState, playbackBasePath]);

  useEffect(() => {
    if (surface !== "video" || !hlsUrl) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setPlayerState("loading");

    const setup = () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        video.addEventListener("loadeddata", () => setPlayerState("playing"), { once: true });
        video.addEventListener("error", () => setPlayerState("offline", "Cámara sin señal"), {
          once: true,
        });
        return;
      }
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setPlayerState("playing");
          void video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setPlayerState("offline", "Cámara sin señal");
        });
      } else {
        setPlayerState("unsupported", "Este navegador no puede reproducir HLS.");
      }
    };

    setup();

    return () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [surface, hlsUrl, cameraId, setPlayerState]);

  const showOverlay = state !== "playing";

  return (
    <div
      className={`stream-player-shell relative aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black/70 ${
        surface === "twitch-sdk"
          ? "aspect-auto min-h-[420px] md:min-h-[560px]"
          : ""
      } ${className}`}
    >
      {surface === "twitch-sdk" && twitchSdkChannel && (
        <TwitchSdkPlayer
          channel={twitchSdkChannel}
          cameraName={cameraName}
          className="absolute inset-0 h-full w-full min-h-0"
          onReady={() => setPlayerState("playing")}
          onError={() => setPlayerState("offline", "Twitch no disponible")}
        />
      )}
      {surface === "iframe" && iframeSrc && (
        <iframe
          title={`Stream ${cameraName}`}
          src={iframeSrc}
          className="h-full w-full min-h-[420px] border-0 bg-black md:min-h-[560px]"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          {...(iframeSrc.includes("player.twitch.tv") || iframeSrc.includes("player.castr.com")
            ? {}
            : {
                sandbox: "allow-scripts allow-same-origin allow-presentation",
              })}
        />
      )}
      {surface === "img" && imgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt="" className="h-full w-full object-contain" />
      )}
      {surface === "video" && (
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          controls
          playsInline
          muted
        />
      )}

      {showOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 px-6 text-center">
          {state === "loading" && <p className="text-sm text-zinc-300">Conectando…</p>}
          {state === "offline" && (
            <>
              <p className="text-base font-medium text-zinc-100">Cámara sin señal</p>
              <p className="max-w-md text-xs text-zinc-400">{detail ?? "Transmisión no disponible"}</p>
            </>
          )}
          {state === "unsupported" && (
            <>
              <p className="text-base font-medium text-amber-200/90">Transmisión no disponible</p>
              <p className="max-w-md text-xs text-zinc-400">{detail}</p>
            </>
          )}
        </div>
      )}

      <span className="sr-only">Reproducción: {cameraName}</span>
    </div>
  );
}
