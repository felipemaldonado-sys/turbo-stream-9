import "./viewer-rappi.css";

/**
 * El CSS del visor vive en el layout para cumplir reglas de Next (CSS global por ruta).
 */
export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
