import type { PlayerState } from "@/components/StreamPlayer";

const labels: Record<PlayerState | "idle", string> = {
  idle: "—",
  loading: "Conectando…",
  playing: "En línea",
  offline: "Sin señal",
  unsupported: "No disponible",
};

const styles: Record<PlayerState | "idle", string> = {
  idle: "bg-zinc-600/40 text-zinc-400",
  loading: "bg-amber-500/20 text-amber-200",
  playing: "bg-emerald-500/20 text-emerald-300",
  offline: "bg-red-500/15 text-red-300",
  unsupported: "bg-orange-500/15 text-orange-200",
};

export function CameraStatusBadge({ state }: { state: PlayerState | "idle" }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[state]}`}
    >
      {labels[state]}
    </span>
  );
}
