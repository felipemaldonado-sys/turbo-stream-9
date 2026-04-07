"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StreamPlayer, type PlayerState } from "@/components/StreamPlayer";
import { SuggestedProductsRow } from "@/components/viewer/SuggestedProductsRow";
import { SUGGESTED_PRODUCTS_CO } from "@/data/suggested-products-co";
import type { PublicCamera } from "@/lib/types/camera";

const TIMER_START = 15 * 60;

function formatTimer(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `Turbo ${m}:${s}`;
}

function statusShort(st: PlayerState | "idle"): string {
  switch (st) {
    case "playing":
      return "En línea";
    case "loading":
      return "…";
    case "offline":
      return "Sin señal";
    case "unsupported":
      return "N/D";
    default:
      return "—";
  }
}

export function ViewerClient() {
  const [mounted, setMounted] = useState(false);
  const [cameras, setCameras] = useState<PublicCamera[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState(false);
  const [statusById, setStatusById] = useState<Record<string, PlayerState | "idle">>({});
  const [timerSec, setTimerSec] = useState(TIMER_START);
  const [progressPct, setProgressPct] = useState(54);
  const progressRef = useRef(54);
  const progressDirRef = useRef(1);

  const refreshList = useCallback(async () => {
    setLoadError(null);
    setListLoading(true);
    try {
      const res = await fetch("/api/public/cameras", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar la lista");
      const data = (await res.json()) as { cameras: PublicCamera[] };
      setCameras(data.cameras);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimerSec((r) => {
        const n = r - 1;
        return n < 0 ? TIMER_START : n;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      progressRef.current += progressDirRef.current * 2;
      if (progressRef.current >= 70) progressDirRef.current = -1;
      if (progressRef.current <= 52) progressDirRef.current = 1;
      setProgressPct(progressRef.current);
    }, 500);
    return () => clearInterval(id);
  }, []);

  /** Siempre hay cámara elegida cuando hay lista (evita hueco vacío antes de que useEffect actualice selectedId). */
  const selected = useMemo(() => {
    if (cameras.length === 0) return null;
    if (selectedId && cameras.some((c) => c.id === selectedId)) {
      return cameras.find((c) => c.id === selectedId)!;
    }
    return cameras[0];
  }, [cameras, selectedId]);

  const setStatus = useCallback((id: string, s: PlayerState) => {
    setStatusById((prev) => ({ ...prev, [id]: s }));
  }, []);

  const onSelectedPlayerState = useCallback(
    (s: PlayerState) => {
      if (selected?.id) setStatus(selected.id, s);
    },
    [selected?.id, setStatus]
  );

  const marqueeCameras = cameras.length > 0 ? [...cameras, ...cameras] : [];

  /** Hasta montar en el cliente no mostramos “sin cámaras” (evita HTML estático incorrecto). */
  const showListLoading = !mounted || listLoading;

  return (
    <div className="viewer-rappi-root">
      <div className="page-shell">
        <header className="top-nav">
          <div className="brand">
            {/* img evita depender del optimizador de imágenes en dev (Sharp) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rappi-logo.png"
              alt="Rappi"
              width={54}
              height={54}
              className="brand-logo"
            />
            <div className="brand-copy">
              <span className="brand-name">Rappi Turbo</span>
              <span className="brand-subtitle">Live fulfillment demo</span>
            </div>
          </div>
          <div className="live-pill">
            <span className="live-dot" />
            En vivo
          </div>
        </header>

        <main className="main-content">
          <section className="hero">
            <div className="hero-copy">
              <div className="timer-pill">{formatTimer(timerSec)}</div>
              <div className="hero-title-wrap">
                <h1>Observa en tiempo real cómo se alista el pedido.</h1>
                <span className="hero-demo-pill" aria-label="Demostración">
                  DEMO
                </span>
              </div>
              <p>
                Transparencia en vivo del fulfillment: misma línea visual que la demo de operación en
                tienda.
              </p>
            </div>
          </section>

          <section className="status-card">
            <span className="status-card-demo-pill" aria-hidden>
              DEMO
            </span>
            <div className="status-header">
              <h2>Seleccionando los productos</h2>
              <span className="status-badge">Pedido en preparación</span>
            </div>
            <div className="progress-row">
              <div className="step-icon active">🛍️</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="step-icon">🏍️</div>
              <div className="mini-track" />
              <div className="step-icon">🏠</div>
            </div>
          </section>

          <section className="stream-section">
            <div className="stream-heading-block">
              <div className="stream-heading-top">
                <div>
                  <p className="stream-kicker">Visual operativa</p>
                  <div className="stream-title-line">
                    <h3>Vista en vivo de preparación</h3>
                    <span className="stream-heading-live">En vivo</span>
                  </div>
                  {selected && <p className="stream-sub-name">{selected.name}</p>}
                </div>
              </div>
              {!showListLoading && !loadError && cameras.length > 0 && (
                <div className="cam-pills" role="tablist" aria-label="Elegir cámara">
                  {cameras.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={!gridMode && selected?.id === c.id}
                      className={!gridMode && selected?.id === c.id ? "is-active" : ""}
                      onClick={() => {
                        setGridMode(false);
                        setSelectedId(c.id);
                      }}
                    >
                      Cam {i + 1}
                    </button>
                  ))}
                  {cameras.length > 1 && (
                    <button
                      type="button"
                      className={`cam-pill-grid ${gridMode ? "is-active" : ""}`}
                      onClick={() => setGridMode(true)}
                    >
                      Todas
                    </button>
                  )}
                </div>
              )}
            </div>

            {loadError && (
              <div className="stream-frame">
                <div className="stream-frame-inner flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
                  <p className="text-base font-medium text-red-300">{loadError}</p>
                  <p className="max-w-md text-sm text-[rgba(255,255,255,0.55)]">
                    Comprueba que el servidor esté en marcha y que exista el archivo de datos.
                  </p>
                  <button
                    type="button"
                    className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    onClick={() => void refreshList()}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {showListLoading && !loadError && (
              <div className="stream-frame">
                <div className="stream-frame-inner flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-[rgba(255,255,255,0.68)]">
                  <p>Cargando cámaras…</p>
                </div>
              </div>
            )}

            {!showListLoading && !gridMode && selected && (
              <div className="stream-frame">
                <div className="stream-frame-inner stream-video-stage">
                  <StreamPlayer
                    cameraId={selected.id}
                    streamType={selected.streamType}
                    cameraName={selected.name}
                    onStateChange={onSelectedPlayerState}
                    className="stream-player-fill !aspect-auto !rounded-none"
                  />
                  <div className="stream-overlay stream-overlay-tl" aria-hidden>
                    <span className="stream-overlay-channel">{selected.name}</span>
                  </div>
                  <div className="stream-overlay stream-overlay-tr" aria-hidden>
                    <span className="stream-overlay-en-vivo">EN VIVO</span>
                  </div>
                </div>
              </div>
            )}

            {!showListLoading && gridMode && cameras.length > 0 && (
              <div className="grid-wrap">
                {cameras.map((c) => (
                  <div key={c.id} className="stream-frame">
                    <div className="stream-frame-inner">
                      <p className="px-4 pt-3 text-sm font-semibold text-white">{c.name}</p>
                      <StreamPlayer
                        cameraId={c.id}
                        streamType={c.streamType}
                        cameraName={c.name}
                        onStateChange={(s) => setStatus(c.id, s)}
                        className="!aspect-auto !rounded-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showListLoading && !loadError && !selected && cameras.length === 0 && (
              <div className="stream-frame">
                <div className="stream-frame-inner flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-[rgba(255,255,255,0.68)]">
                  <p>No hay cámaras activas.</p>
                  <p className="mt-2 text-sm">Un administrador debe configurar cámaras en el panel.</p>
                </div>
              </div>
            )}
          </section>

          <section className="products-section">
            {!showListLoading && cameras.length > 0 && (
              <>
                <div className="products-header">
                  <div>
                    <p className="products-kicker">Pedido en preparación</p>
                    <h3>Cámaras disponibles</h3>
                  </div>
                  <span className="products-badge">Actualización en vivo</span>
                </div>
                <div className="products-marquee">
                  <div className="products-track">
                    {marqueeCameras.map((c, i) => {
                      const st = statusById[c.id] ?? "idle";
                      const isSel = selected ? c.id === selected.id : false;
                      return (
                        <button
                          key={`${c.id}-${i}`}
                          type="button"
                          className={`product-card ${isSel ? "is-selected" : ""}`}
                          onClick={() => setSelectedId(c.id)}
                        >
                          <div className="product-image">
                            {c.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.thumbnail} alt="" />
                            ) : (
                              <span className="text-2xl" aria-hidden>
                                📹
                              </span>
                            )}
                          </div>
                          <div className="product-info">
                            <p className="product-name">{c.name}</p>
                            <p className="product-desc">{c.description ?? "Toca para ver en vivo"}</p>
                          </div>
                          <span className="product-tag">{statusShort(st)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            <SuggestedProductsRow products={SUGGESTED_PRODUCTS_CO} />
          </section>
        </main>
      </div>
    </div>
  );
}
