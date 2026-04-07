"use client";

import { useState } from "react";
import type { SuggestedProduct } from "@/data/suggested-products-co";

type Props = {
  products: SuggestedProduct[];
};

/**
 * Fila tipo gopuff: tarjetas pequeñas, scroll horizontal, estética suave (no modales agresivos).
 */
export function SuggestedProductsRow({ products }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = products.filter((p) => !dismissed.has(p.id));

  if (visible.length === 0) return null;

  return (
    <div className="suggested-wrap">
      <div className="suggested-header">
        <div>
          <p className="suggested-kicker">Para tu pedido</p>
          <h4 className="suggested-title">Productos sugeridos</h4>
        </div>
        <span className="suggested-hint">Desliza — estilo quick commerce</span>
      </div>
      <div className="suggested-scroll" role="region" aria-label="Productos sugeridos">
        {visible.map((p) => (
          <article key={p.id} className="suggested-pop">
            <button
              type="button"
              className="suggested-dismiss"
              aria-label={`Quitar ${p.name}`}
              onClick={() => setDismissed((s) => new Set(s).add(p.id))}
            >
              ×
            </button>
            <div className="suggested-pop-inner">
              <span className="suggested-emoji" aria-hidden>
                {p.emoji}
              </span>
              <div className="suggested-text">
                <p className="suggested-name">{p.name}</p>
                <p className="suggested-price">{p.priceLabel}</p>
                {p.hint && <p className="suggested-sub">{p.hint}</p>}
              </div>
            </div>
            <span className="suggested-chip">Sugerido</span>
          </article>
        ))}
      </div>
    </div>
  );
}
