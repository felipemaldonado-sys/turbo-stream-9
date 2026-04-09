"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  resolvedSuggestedImageUrl,
  SUGGESTED_PRODUCT_IMAGE_FALLBACK,
  type SuggestedProduct,
} from "@/data/suggested-products-co";

/** Debe coincidir con `var(--suggested-marquee-duration)` en viewer-rappi.css */
const MARQUEE_DURATION_SEC = 30;
const LIST_DURATION_SEC = 30;

const marqueeDurationMs = MARQUEE_DURATION_SEC * 1000;
const listDurationMs = LIST_DURATION_SEC * 1000;

function SuggestedThumb({
  imageUrl,
  productId,
  name,
  thumbClassName,
}: {
  imageUrl: string;
  productId: string;
  name: string;
  /** Clases del contenedor de la imagen (p. ej. llenar la tarjeta). */
  thumbClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const fallbackUrl = SUGGESTED_PRODUCT_IMAGE_FALLBACK[productId];

  const src = useFallback && fallbackUrl
    ? resolvedSuggestedImageUrl(fallbackUrl)
    : resolvedSuggestedImageUrl(imageUrl);

  const wrap = thumbClassName ?? "suggested-thumb";

  if (broken) {
    return (
      <div className={`${wrap} suggested-thumb--fallback`.trim()} aria-hidden>
        <span>{name.slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className={wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => {
          if (fallbackUrl && !useFallback) {
            setUseFallback(true);
            return;
          }
          setBroken(true);
        }}
      />
    </div>
  );
}

type Props = {
  products: SuggestedProduct[];
  /** Oculta toda la franja (el padre puede mostrar un botón para volver). */
  onHideStrip: () => void;
};

type ViewMode = "marquee" | "list";

function IconListView({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        fill="currentColor"
        d="M4 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.5 1h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1 0-1ZM4 11.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.5 1h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1 0-1ZM4 17a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.5 1h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1 0-1Z"
      />
    </svg>
  );
}

function IconCarouselView({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <rect x="2" y="7" width="5" height="10" rx="1.2" fill="currentColor" opacity={0.38} />
      <rect x="8" y="5" width="8" height="14" rx="1.5" fill="currentColor" />
      <rect x="17" y="7" width="5" height="10" rx="1.2" fill="currentColor" opacity={0.38} />
    </svg>
  );
}

/**
 * Carrusel horizontal; al terminar una vuelta completa pasa a tarjeta “live” con lista
 * (mismos productos, enlaces a Rappi, quitar ítem). Luego vuelve al carrusel en bucle.
 * El usuario puede alternar vista con el botón de icono (lista / carrusel) sin desactivar los temporizadores.
 */
export function SuggestedProductsRow({ products, onHideStrip }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("marquee");
  const [marqueeKey, setMarqueeKey] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => products.filter((p) => !dismissed.has(p.id)),
    [products, dismissed]
  );

  const loop = useMemo(() => [...visible, ...visible], [visible]);

  const goToList = useCallback(() => {
    setViewMode("list");
  }, []);

  const goToMarquee = useCallback(() => {
    setViewMode("marquee");
    setMarqueeKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (visible.length === 0) return;
    if (viewMode !== "marquee") return;

    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      const id = window.setTimeout(goToList, marqueeDurationMs);
      return () => window.clearTimeout(id);
    }

    const el = trackRef.current;
    if (!el) return;

    const onIteration = () => goToList();
    el.addEventListener("animationiteration", onIteration);
    return () => el.removeEventListener("animationiteration", onIteration);
  }, [viewMode, marqueeKey, visible.length, goToList]);

  useEffect(() => {
    if (visible.length === 0) return;
    if (viewMode !== "list") return;

    const id = window.setTimeout(goToMarquee, listDurationMs);
    return () => window.clearTimeout(id);
  }, [viewMode, visible.length, goToMarquee]);

  if (visible.length === 0) {
    return (
      <div className="suggested-overlay suggested-overlay--empty">
        <div className="suggested-overlay-header">
          <button type="button" className="suggested-strip-hide" onClick={onHideStrip}>
            Ocultar
          </button>
        </div>
        <p className="suggested-overlay-empty-msg">No quedan sugerencias en esta sesión.</p>
      </div>
    );
  }

  const marqueeStyle = {
    "--suggested-marquee-duration": `${MARQUEE_DURATION_SEC}s`,
  } as CSSProperties;

  return (
    <div
      className={`suggested-overlay${viewMode === "list" ? " suggested-overlay--list-mode" : ""}`}
      aria-label="Productos sugeridos"
    >
      <div className="suggested-overlay-header">
        <div className="suggested-overlay-header-actions">
          {viewMode === "marquee" ? (
            <button
              type="button"
              className="suggested-view-toggle"
              aria-label="Ver productos como lista"
              title="Ver como lista"
              onClick={goToList}
            >
              <IconListView />
            </button>
          ) : (
            <button
              type="button"
              className="suggested-view-toggle"
              aria-label="Ver productos en carrusel"
              title="Ver como carrusel"
              onClick={goToMarquee}
            >
              <IconCarouselView />
            </button>
          )}
          <button type="button" className="suggested-strip-hide" onClick={onHideStrip}>
            Ocultar
          </button>
        </div>
      </div>

      {viewMode === "marquee" ? (
        <div className="suggested-marquee-outer" style={marqueeStyle}>
          <div key={marqueeKey} ref={trackRef} className="suggested-marquee-track">
            {loop.map((p, i) => (
              <article key={`${p.id}-${i}`} className="suggested-pop suggested-pop--overlay">
                <button
                  type="button"
                  className="suggested-dismiss"
                  aria-label={`Quitar ${p.name}`}
                  onClick={() => setDismissed((s) => new Set(s).add(p.id))}
                >
                  ×
                </button>
                <a
                  href={p.rappiProductUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="suggested-pop-link"
                  aria-label={`${p.name}. Abrir en Rappi`}
                >
                  <SuggestedThumb
                    imageUrl={p.imageUrl}
                    productId={p.id}
                    name={p.name}
                    thumbClassName="suggested-thumb suggested-thumb--fill"
                  />
                  <div className="suggested-text suggested-text--overlay">
                    <p className="suggested-name">{p.name}</p>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="suggested-live-stack">
          <div className="suggested-live-card">
            <div className="suggested-live-card-header-row">
              <h2 className="suggested-live-heading">Productos sugeridos</h2>
              <button
                type="button"
                className="suggested-live-card-close"
                aria-label="Ocultar lista y volver al carrusel"
                onClick={goToMarquee}
              >
                ×
              </button>
            </div>
            <div className="suggested-live-divider" role="presentation" />
            <ul className="suggested-live-list">
              {visible.map((p) => (
                <li key={p.id} className="suggested-live-item">
                  <a
                    href={p.rappiProductUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="suggested-live-row"
                    aria-label={`${p.name}. Abrir en Rappi`}
                  >
                    <SuggestedThumb
                      imageUrl={p.imageUrl}
                      productId={p.id}
                      name={p.name}
                      thumbClassName="suggested-live-row-thumb"
                    />
                    <p className="suggested-live-row-name">{p.name}</p>
                  </a>
                  <button
                    type="button"
                    className="suggested-live-item-dismiss"
                    aria-label={`Quitar ${p.name}`}
                    onClick={() => setDismissed((s) => new Set(s).add(p.id))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
