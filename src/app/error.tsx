"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07080c] px-6 text-center text-white">
      <p className="text-lg font-semibold">Algo salió mal</p>
      <p className="mt-2 max-w-md text-sm text-white/60">{error.message || "Error inesperado"}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
      >
        Reintentar
      </button>
    </div>
  );
}
