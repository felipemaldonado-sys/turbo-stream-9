import { ViewerClient } from "./viewer-client";

export const metadata = {
  title: "Rappi Turbo Live",
  description: "Observa en tiempo real la preparación del pedido",
};

/** Evita HTML estático en build con “0 cámaras” que confunde al hidratar. */
export const dynamic = "force-dynamic";

/**
 * Formato visual alineado con index.html (Rappi Turbo Live).
 * Sin enlaces al admin.
 */
export default function ViewerPage() {
  return <ViewerClient />;
}
