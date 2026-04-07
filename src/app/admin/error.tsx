"use client";

/**
 * Evita pantalla en blanco si el panel falla al hidratar o por error de datos.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07080c] px-6 text-center">
      <p className="text-lg font-semibold text-zinc-100">Error en administración</p>
      <p className="mt-2 max-w-md text-sm text-zinc-400">{error.message || "Algo salió mal"}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
      >
        Reintentar
      </button>
    </div>
  );
}
