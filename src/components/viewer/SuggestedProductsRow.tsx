"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  resolvedSuggestedImageUrl,
  SUGGESTED_PRODUCT_IMAGE_FALLBACK,
  type SuggestedProduct,
} from "@/data/suggested-products-co";

/** Debe coincidir con `var(--suggested-marquee-duration)` en viewer-rappi.css */
const MARQUEE_DURATION_SEC = 30;

/** La franja de lista aparece tras este tiempo (página ya cargada). */
const LIST_SHOW_DELAY_MS = 3000;

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
 * Lista principal (tras un breve retraso) con marquee vertical en CSS, como el carrusel horizontal;
 * carrusel solo desde el botón de vista.
 */
export function SuggestedProductsRow({ products, onHideStrip }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [marqueeKey, setMarqueeKey] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const visible = useMemo(
    () => products.filter((p) => !dismissed.has(p.id)),
    [products, dismissed]
  );

  const listLoop = useMemo(() => [...visible, ...visible], [visible]);

  const loop = useMemo(() => [...visible, ...visible], [visible]);

  const goToList = useCallback(() => {
    setViewMode("list");
  }, []);

  const goToMarquee = useCallback(() => {
    setViewMode("marquee");
    setMarqueeKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const id = window.setTimeout(() => setOverlayVisible(true), LIST_SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [products.length]);

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

  if (!overlayVisible) {
    return null;
  }

  const marqueeStyle = {
    "--suggested-marquee-duration": `${MARQUEE_DURATION_SEC}s`,
  } as CSSProperties;

  const listMarqueeStyle = {
    "--suggested-list-marquee-duration": `${MARQUEE_DURATION_SEC}s`,
  } as CSSProperties;

  return (
    <div
      className={`suggested-overlay${viewMode === "list" ? " suggested-overlay--list-mode" : ""}`}
      aria-label="Productos en empaque"
    >
      <div className="suggested-overlay-header">
        <div className="suggested-overlay-header-actions">
          {viewMode === "list" ? (
            <button
              type="button"
              className="suggested-view-toggle"
              aria-label="Ver productos en carrusel"
              title="Ver como carrusel"
              onClick={goToMarquee}
            >
              <IconCarouselView />
            </button>
          ) : (
            <button
              type="button"
              className="suggested-view-toggle"
              aria-label="Ver productos como lista"
              title="Ver como lista"
              onClick={goToList}
            >
              <IconListView />
            </button>
          )}
          <button type="button" className="suggested-strip-hide" onClick={onHideStrip}>
            Ocultar
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="suggested-live-stack suggested-live-stack--enter">
          <div className="suggested-live-card">
            <div className="suggested-live-card-header-row">
              <h2 className="suggested-live-heading">
                Productos reales, empacados en tiempo real
              </h2>
              <button
                type="button"
                className="suggested-live-card-close"
                aria-label="Cerrar lista y ver carrusel"
                onClick={goToMarquee}
              >
                ×
              </button>
            </div>
            <div className="suggested-live-divider" role="presentation" />
            <div className="suggested-live-list-outer" style={listMarqueeStyle}>
              <ul className="suggested-live-list suggested-live-list--marquee">
                {listLoop.map((p, copyIdx) => (
                  <li key={`${p.id}-${copyIdx}`} className="suggested-live-item">
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
        </div>
      ) : (
        <div className="suggested-marquee-outer" style={marqueeStyle}>
          <div key={marqueeKey} className="suggested-marquee-track">
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
      )}
    </div>
  );
}
