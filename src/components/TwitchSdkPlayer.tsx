"use client";

/**
 * Embed interactivo: https://player.twitch.tv/js/embed/v1.js + `new Twitch.Player(...)`.
 * Requiere `parent` alineado con el dominio que sirve la página.
 * @see https://dev.twitch.tv/docs/embed/video-and-clips
 */

import { useEffect, useId, useRef } from "react";

type TwitchPlayerInstance = {
  addEventListener: (event: string, cb: () => void) => void;
  destroy?: () => void;
};

type TwitchPlayerConstructor = new (
  id: string,
  options: Record<string, unknown>
) => TwitchPlayerInstance;

declare global {
  interface Window {
    Twitch?: {
      Player: TwitchPlayerConstructor & {
        READY: string;
        PLAYING: string;
        OFFLINE: string;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

const TWITCH_EMBED_SRC = "https://player.twitch.tv/js/embed/v1.js";

function waitForTwitchApi(maxMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const id = window.setInterval(() => {
      if (window.Twitch?.Player) {
        window.clearInterval(id);
        resolve();
      } else if (Date.now() - t0 > maxMs) {
        window.clearInterval(id);
        reject(new Error("Twitch script timeout"));
      }
    }, 50);
  });
}

function loadTwitchEmbedScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Twitch?.Player) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = (async () => {
    let el = document.querySelector(`script[src="${TWITCH_EMBED_SRC}"]`);
    if (!el) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = TWITCH_EMBED_SRC;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Twitch embed script failed"));
        document.body.appendChild(s);
      });
    }
    await waitForTwitchApi();
  })();

  return scriptPromise;
}

type Props = {
  channel: string;
  cameraName: string;
  className?: string;
  onReady?: () => void;
  onError?: () => void;
};

export function TwitchSdkPlayer({
  channel,
  cameraName,
  className = "",
  onReady,
  onError,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const containerId = `twitch-sdk-${reactId}`;
  const playerRef = useRef<TwitchPlayerInstance | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      try {
        await loadTwitchEmbedScript();
        if (cancelled || typeof window === "undefined" || !window.Twitch?.Player) return;

        const Player = window.Twitch.Player;
        const shell = shellRef.current;
        const rect = shell?.getBoundingClientRect();
        const w = Math.max(400, Math.floor(rect?.width ?? shell?.clientWidth ?? 854));
        const h = Math.max(300, Math.floor(rect?.height ?? shell?.clientHeight ?? 480));

        const extra =
          process.env.NEXT_PUBLIC_TWITCH_EMBED_EXTRA_PARENTS?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) ?? [];

        const host = window.location.hostname;
        const parentList = [host, ...extra];
        if (host === "localhost") parentList.push("127.0.0.1");
        const parent = [...new Set(parentList)];

        const player = new Player(containerId, {
          width: w,
          height: h,
          channel,
          parent,
          muted: true,
          autoplay: true,
        });
        playerRef.current = player;

        let settled = false;
        const clearFallback = () => {
          if (fallbackTimer !== undefined) {
            clearTimeout(fallbackTimer);
            fallbackTimer = undefined;
          }
        };

        const signalReady = () => {
          if (cancelled || settled) return;
          settled = true;
          clearFallback();
          onReadyRef.current?.();
        };

        const signalError = () => {
          if (cancelled || settled) return;
          settled = true;
          clearFallback();
          onErrorRef.current?.();
        };

        player.addEventListener(Player.PLAYING, signalReady);
        player.addEventListener(Player.OFFLINE, signalError);

        player.addEventListener(Player.READY, () => {
          fallbackTimer = setTimeout(() => {
            if (!cancelled && !settled) signalReady();
          }, 2500);
        });
      } catch {
        onErrorRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, [channel, containerId]);

  return (
    <div
      ref={shellRef}
      id={containerId}
      className={`twitch-sdk-root h-full w-full min-h-[420px] bg-black md:min-h-[560px] ${className}`}
      aria-label={cameraName}
    />
  );
}
