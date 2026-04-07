export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#07080c] to-[#0c0f16] px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-zinc-50">Visor de cámaras IP</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Accede al visor público para ver las cámaras activas. La administración es solo por URL
          directa (no enlazada desde aquí).
        </p>
        <p className="mt-3 text-sm text-amber-200/90">
          Si algo falla: no pegues varios comandos en una sola línea. Desde la carpeta del proyecto ejecuta{" "}
          <code className="text-zinc-400">npm run dev:go</code> y abre{" "}
          <code className="text-zinc-400">http://localhost:3333/viewer</code> (puerto fijo).
        </p>
        <a
          href="/viewer"
          className="mt-8 inline-flex rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Abrir visor
        </a>
        <p className="mt-8 text-[11px] text-zinc-600">
          Ruta alternativa: <code className="text-zinc-500">/live</code> redirige al visor.
        </p>
      </div>
    </div>
  );
}
