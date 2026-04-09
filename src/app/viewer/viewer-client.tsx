"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { StreamPlayer } from "@/components/StreamPlayer";
import { SuggestedProductsRow } from "@/components/viewer/SuggestedProductsRow";
import { SUGGESTED_PRODUCTS_CO } from "@/data/suggested-products-co";
import type { PublicCamera } from "@/lib/types/camera";

function SuggestionsDock({
  visible,
  onHide,
  onShow,
  children,
  padWhenStrip,
}: {
  visible: boolean;
  onHide: () => void;
  onShow: () => void;
  children: ReactNode;
  /** Espacio inferior cuando la franja está visible (evita que el texto quede tapado). */
  padWhenStrip?: boolean;
}) {
  return (
    <div className="stream-suggestions-anchor">
      <div className={padWhenStrip && visible ? "stream-suggestions-pad" : undefined}>{children}</div>
      {visible ? (
        <SuggestedProductsRow products={SUGGESTED_PRODUCTS_CO} onHideStrip={onHide} />
      ) : (
        <button type="button" className="suggestions-restore-fab" onClick={onShow}>
          Mostrar sugerencias
        </button>
      )}
    </div>
  );
}

export function ViewerClient() {
  const [mounted, setMounted] = useState(false);
  const [cameras, setCameras] = useState<PublicCamera[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState(false);
  const [suggestionsStripVisible, setSuggestionsStripVisible] = useState(true);

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

  const selected = useMemo(() => {
    if (cameras.length === 0) return null;
    if (selectedId && cameras.some((c) => c.id === selectedId)) {
      return cameras.find((c) => c.id === selectedId)!;
    }
    return cameras[0];
  }, [cameras, selectedId]);

  const showListLoading = !mounted || listLoading;

  const dockHide = useCallback(() => setSuggestionsStripVisible(false), []);
  const dockShow = useCallback(() => setSuggestionsStripVisible(true), []);

  return (
    <div className="viewer-rappi-root">
      <div className="page-shell">
        <header className="top-nav">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/turbo-logo.png" alt="Turbo" className="brand-turbo-mark" width={160} height={40} />
            <div className="brand-copy">
              <span className="brand-name">Turbo Stream</span>
              <span className="brand-subtitle">Demo</span>
            </div>
          </div>
          <div className="live-pill">
            <span className="live-dot" />
            En vivo
          </div>
        </header>

        <main className="main-content">
          <section className="stream-section">
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

            {loadError && (
              <div className="stream-frame">
                <div className="stream-frame-inner min-h-[320px]">
                  <SuggestionsDock
                    visible={suggestionsStripVisible}
                    onHide={dockHide}
                    onShow={dockShow}
                    padWhenStrip
                  >
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
                      <p className="text-base font-medium text-red-600">{loadError}</p>
                      <p className="max-w-md text-sm text-neutral-600">
                        Comprueba que el servidor esté en marcha y que exista el archivo de datos.
                      </p>
                      <button
                        type="button"
                        className="rounded-full border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                        onClick={() => void refreshList()}
                      >
                        Reintentar
                      </button>
                    </div>
                  </SuggestionsDock>
                </div>
              </div>
            )}

            {showListLoading && !loadError && (
              <div className="stream-frame">
                <div className="stream-frame-inner min-h-[320px]">
                  <SuggestionsDock
                    visible={suggestionsStripVisible}
                    onHide={dockHide}
                    onShow={dockShow}
                    padWhenStrip
                  >
                    <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-neutral-600">
                      <p>Cargando cámaras…</p>
                    </div>
                  </SuggestionsDock>
                </div>
              </div>
            )}

            {!showListLoading && !gridMode && selected && (
              <div className="stream-frame">
                <div className="stream-frame-inner stream-video-stage stream-suggestions-anchor">
                  <StreamPlayer
                    cameraId={selected.id}
                    streamType={selected.streamType}
                    cameraName={selected.name}
                    className="stream-player-fill !aspect-auto !rounded-none"
                  />
                  {suggestionsStripVisible ? (
                    <SuggestedProductsRow products={SUGGESTED_PRODUCTS_CO} onHideStrip={dockHide} />
                  ) : (
                    <button type="button" className="suggestions-restore-fab" onClick={dockShow}>
                      Mostrar sugerencias
                    </button>
                  )}
                </div>
              </div>
            )}

            {!showListLoading && gridMode && cameras.length > 0 && (
              <div className="stream-frame stream-frame--grid-host">
                <div className="stream-frame-inner stream-suggestions-anchor stream-suggestions-anchor--grid">
                  <div className="grid-wrap">
                    {cameras.map((c) => (
                      <div key={c.id} className="stream-frame stream-frame--nested">
                        <div className="stream-frame-inner">
                          <StreamPlayer
                            cameraId={c.id}
                            streamType={c.streamType}
                            cameraName={c.name}
                            className="!aspect-auto !rounded-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {suggestionsStripVisible ? (
                    <SuggestedProductsRow products={SUGGESTED_PRODUCTS_CO} onHideStrip={dockHide} />
                  ) : (
                    <button type="button" className="suggestions-restore-fab" onClick={dockShow}>
                      Mostrar sugerencias
                    </button>
                  )}
                </div>
              </div>
            )}

            {!showListLoading && !loadError && !selected && cameras.length === 0 && (
              <div className="stream-frame">
                <div className="stream-frame-inner min-h-[320px]">
                  <SuggestionsDock
                    visible={suggestionsStripVisible}
                    onHide={dockHide}
                    onShow={dockShow}
                    padWhenStrip
                  >
                    <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-neutral-600">
                      <p>No hay cámaras Castr activas.</p>
                      <p className="mt-2 text-sm text-neutral-500">
                        Configura fuentes en player.castr.com en el panel de administración.
                      </p>
                    </div>
                  </SuggestionsDock>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
