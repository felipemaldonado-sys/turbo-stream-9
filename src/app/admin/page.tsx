"use client";

/**
 * Panel de administración — rutas /admin y /configure (redirect).
 * TODO: proteger con NextAuth, middleware de sesión o Basic Auth en el proxy.
 * No enlazar esta URL desde el visor público.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { StreamPlayer } from "@/components/StreamPlayer";
import type { MediaEndpoints } from "@/lib/media-config";
import type { CameraRecord, StreamType } from "@/lib/types/camera";

const STREAM_OPTIONS: { value: StreamType; label: string }[] = [
  { value: "hls", label: "HLS (m3u8)" },
  { value: "rtsp", label: "RTSP (requiere gateway a HLS)" },
  { value: "mjpeg", label: "MJPEG" },
  { value: "iframe", label: "iframe / embed (Twitch: pega URL del canal)" },
  { value: "unknown", label: "Desconocido (probar como HLS)" },
];

const defaultMedia: MediaEndpoints = {
  rtmpRoot: "rtmp://127.0.0.1:1935",
  rtmpPublishBase: "rtmp://127.0.0.1:1935/live",
  hlsBase: "http://127.0.0.1:8000",
};

/** Copia local de la lista de cámaras (sobrevive refrescos y demos sin disco escribible). */
const ADMIN_CAMERAS_BACKUP_KEY = "turbo-stream-cameras-backup-v1";

const emptyForm = {
  name: "",
  sourceUrl: "",
  streamType: "hls" as StreamType,
  order: 0,
  isActive: true,
  description: "",
  thumbnail: "",
  useRtmpRelay: false,
};

function rtmpIngestUrl(media: MediaEndpoints, ingestKey: string): string {
  return `${media.rtmpPublishBase}/${ingestKey}`;
}

function hlsPlayUrl(media: MediaEndpoints, ingestKey: string): string {
  return `${media.hlsBase}/live/${ingestKey}/index.m3u8`;
}

export default function AdminPage() {
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [media, setMedia] = useState<MediaEndpoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Cámara mostrada en el monitor de admin (vista previa siempre que exista fuente). */
  const [previewCameraId, setPreviewCameraId] = useState<string | null>(null);
  /** Hay una copia guardada en el navegador (fecha de guardado). */
  const [localBackupAt, setLocalBackupAt] = useState<number | null>(null);

  const m = media ?? defaultMedia;

  const camerasSorted = useMemo(() => {
    return [...cameras].sort((a, b) => {
      const ao = typeof a.order === "number" ? a.order : 0;
      const bo = typeof b.order === "number" ? b.order : 0;
      if (ao !== bo) return ao - bo;
      return String(a.name).localeCompare(String(b.name));
    });
  }, [cameras]);

  const previewCamera = previewCameraId ? cameras.find((c) => c.id === previewCameraId) : undefined;

  useEffect(() => {
    if (cameras.length === 0) {
      setPreviewCameraId(null);
      return;
    }
    const stillThere = previewCameraId && cameras.some((c) => c.id === previewCameraId);
    if (!stillThere) {
      setPreviewCameraId(camerasSorted[0]?.id ?? null);
    }
  }, [cameras, camerasSorted, previewCameraId]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/cameras");
      if (!res.ok) throw new Error("Error al cargar");
      const data = (await res.json()) as { cameras: CameraRecord[]; media?: MediaEndpoints };
      setCameras(data.cameras);
      setMedia(data.media ?? null);
      try {
        const savedAt = Date.now();
        localStorage.setItem(
          ADMIN_CAMERAS_BACKUP_KEY,
          JSON.stringify({ v: 1, cameras: data.cameras, savedAt })
        );
        setLocalBackupAt(savedAt);
      } catch {
        /* quota / modo privado */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreLocalBackup = async () => {
    setError(null);
    try {
      const raw = localStorage.getItem(ADMIN_CAMERAS_BACKUP_KEY);
      if (!raw) {
        setError("No hay copia local guardada en este navegador.");
        return;
      }
      const parsed = JSON.parse(raw) as { cameras?: CameraRecord[] };
      if (!parsed.cameras?.length) {
        setError("La copia local está vacía.");
        return;
      }
      const res = await fetch("/api/cameras/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameras: parsed.cameras }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "No se pudo restaurar");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al restaurar");
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_CAMERAS_BACKUP_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { savedAt?: number; cameras?: unknown };
      if (
        typeof parsed.savedAt === "number" &&
        Array.isArray(parsed.cameras) &&
        parsed.cameras.length > 0
      ) {
        setLocalBackupAt(parsed.savedAt);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.useRtmpRelay && !form.sourceUrl.trim()) {
      setError("Indica una URL de fuente o marca «Recibir por RTMP».");
      return;
    }
    const res = await fetch("/api/cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        sourceUrl: form.useRtmpRelay ? "" : form.sourceUrl,
        streamType: form.useRtmpRelay ? "hls" : form.streamType,
        order: form.order,
        isActive: form.isActive,
        description: form.description || undefined,
        thumbnail: form.thumbnail || undefined,
        useRtmpIngest: form.useRtmpRelay,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Error al crear");
      return;
    }
    setForm(emptyForm);
    await load();
  };

  const startEdit = (c: CameraRecord) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      sourceUrl: c.ingestKey ? "" : c.sourceUrl,
      streamType: c.streamType,
      order: c.order,
      isActive: c.isActive,
      description: c.description ?? "",
      thumbnail: c.thumbnail ?? "",
      useRtmpRelay: Boolean(c.ingestKey),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    const editing = cameras.find((x) => x.id === editingId);
    const isRelay = Boolean(editing?.ingestKey);
    if (!isRelay && !form.sourceUrl.trim()) {
      setError("Indica una URL de fuente.");
      return;
    }
    const res = await fetch(`/api/cameras/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        sourceUrl: isRelay ? "" : form.sourceUrl,
        streamType: form.streamType,
        order: form.order,
        isActive: form.isActive,
        description: form.description || undefined,
        thumbnail: form.thumbnail || undefined,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Error al guardar");
      return;
    }
    cancelEdit();
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta cámara?")) return;
    setError(null);
    const res = await fetch(`/api/cameras/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("No se pudo eliminar");
      return;
    }
    await load();
  };

  const toggleActive = async (c: CameraRecord) => {
    setError(null);
    const res = await fetch(`/api/cameras/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (!res.ok) {
      setError("No se pudo actualizar");
      return;
    }
    await load();
  };

  const enableRelay = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/cameras/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enableRtmpRelay: true }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "No se pudo activar RTMP");
      return;
    }
    await load();
  };

  const rotateRelayKey = async (id: string) => {
    if (!confirm("¿Generar una nueva clave? La cámara deberá usar la nueva URL RTMP.")) return;
    setError(null);
    const res = await fetch(`/api/cameras/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rotateIngestKey: true }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "No se pudo rotar la clave");
      return;
    }
    await load();
  };

  const editingCamera = editingId ? cameras.find((c) => c.id === editingId) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07080c] to-[#0c0f16]">
      <header className="border-b border-surface-border/80 bg-[#0a0c11]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/90">
            Privado
          </p>
          <h1 className="text-xl font-semibold text-zinc-50">Administración de cámaras</h1>
          <p className="mt-1 text-xs text-zinc-500">
            Monitor en vivo al abrir admin; activa o desactiva cada cámara para el visor público cuando quieras.
          </p>
          {localBackupAt != null && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>
                Copia local:{" "}
                {new Date(localBackupAt).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              <button
                type="button"
                onClick={() => void restoreLocalBackup()}
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-medium text-amber-200 hover:bg-amber-500/20"
              >
                Restaurar última copia local
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && cameras.length > 0 && previewCamera && (
          <section className="mb-8 rounded-2xl border border-emerald-500/30 bg-[#0a1210]/80 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-emerald-200">Monitor en vivo (admin)</h2>
                <p className="mt-1 max-w-xl text-xs text-zinc-500">
                  Se reproduce al cargar esta página. Aquí ves Twitch u otras fuentes aunque la cámara esté{" "}
                  <strong className="text-zinc-400">desactivada</strong> para el visor. La columna «Activa» en
                  la tabla controla si el público la ve en <code className="text-zinc-500">/viewer</code>.
                </p>
              </div>
              <label className="block shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-zinc-500">Cámara en monitor</span>
                <select
                  value={previewCamera.id}
                  onChange={(e) => setPreviewCameraId(e.target.value)}
                  className="mt-1 block min-w-[200px] rounded-lg border border-surface-border bg-[#0f1117] px-3 py-2 text-sm text-zinc-100"
                >
                  {camerasSorted.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {!c.isActive ? " (off en público)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <StreamPlayer
                key={previewCamera.id}
                cameraId={previewCamera.id}
                streamType={previewCamera.streamType}
                cameraName={previewCamera.name}
                playbackBasePath="/api/admin/cameras"
                className="!rounded-none !border-0"
              />
            </div>
          </section>
        )}

        <section className="mb-8 rounded-2xl border border-cyan-500/25 bg-cyan-950/20 p-5 text-sm text-zinc-300">
          <h2 className="text-sm font-semibold text-cyan-200">Servidor RTMP → HLS</h2>
          <p className="mt-2 leading-relaxed text-zinc-400">
            En otra terminal ejecuta <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">npm run media-server</code> (necesitas{" "}
            <code className="font-mono text-xs">ffmpeg</code> instalado). Publica en{" "}
            <code className="font-mono text-xs">{m.rtmpPublishBase}/&lt;clave&gt;</code>; el visor reproducirá el HLS
            servido en el puerto HTTP del mismo proceso (p. ej. 8000). Configura{" "}
            <code className="font-mono text-xs">MEDIA_RTMP_PUBLIC_URL</code> /{" "}
            <code className="font-mono text-xs">MEDIA_RTMP_HOST</code> y{" "}
            <code className="font-mono text-xs">MEDIA_HLS_PUBLIC_BASE_URL</code> /{" "}
            <code className="font-mono text-xs">MEDIA_HLS_HOST</code> en{" "}
            <code className="font-mono text-xs">.env.local</code> para que las URLs RTMP/HLS muestren tu dominio.
          </p>
        </section>

        <section className="mb-10 rounded-2xl border border-surface-border bg-surface-raised/60 p-6">
          <h2 className="text-sm font-semibold text-zinc-200">
            {editingId ? "Editar cámara" : "Nueva cámara"}
          </h2>
          <form
            onSubmit={editingId ? submitUpdate : submitCreate}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <label className="block sm:col-span-2">
              <span className="text-xs text-zinc-500">Nombre visible</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-surface-border bg-[#0f1117] px-3 py-2 text-sm text-zinc-100"
              />
            </label>

            {!editingId && (
              <label className="flex items-start gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.useRtmpRelay}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      useRtmpRelay: e.target.checked,
                      streamType: e.target.checked ? "hls" : f.streamType,
                    }))
                  }
                  className="mt-1 rounded border-surface-border"
                />
                <span className="text-sm text-zinc-300">
                  Recibir por RTMP (se genera una clave; configura la cámara u OBS con la URL que aparece al guardar).
                </span>
              </label>
            )}

            {!form.useRtmpRelay && !(editingCamera?.ingestKey) && (
              <label className="block sm:col-span-2">
                <span className="text-xs text-zinc-500">URL de fuente (m3u8, embed, etc.)</span>
                <input
                  required={!editingId || !editingCamera?.ingestKey}
                  value={form.sourceUrl}
                  onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                  placeholder="https://…m3u8 o URL del fabricante"
                  className="mt-1 w-full rounded-lg border border-surface-border bg-[#0f1117] px-3 py-2 font-mono text-xs text-zinc-100"
                />
              </label>
            )}

            {editingCamera?.ingestKey && (
              <div className="sm:col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
                  URLs para esta cámara (relay RTMP)
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-[10px] text-zinc-500">
                      Publicar (cámara / OBS) — protocolo <strong className="text-zinc-400">RTMP</strong>, puerto{" "}
                      <strong className="text-zinc-400">1935</strong> (no uses la URL que termina en{" "}
                      <code className="text-zinc-500">.m3u8</code> aquí).
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <code className="max-w-full flex-1 break-all rounded bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-200">
                          Servidor (RTMP): {m.rtmpPublishBase}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyText(m.rtmpPublishBase)}
                          className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                        >
                          Copiar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <code className="max-w-full flex-1 break-all rounded bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-200">
                          Clave (stream key): {editingCamera.ingestKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyText(editingCamera.ingestKey!)}
                          className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                        >
                          Copiar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <code className="max-w-full flex-1 break-all rounded bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-200">
                          RTMP completo (opcional): {rtmpIngestUrl(m, editingCamera.ingestKey)}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyText(rtmpIngestUrl(m, editingCamera.ingestKey!))}
                          className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">
                      Reproducción <strong className="text-zinc-400">HLS</strong> (HTTP, suele puerto 8000) — es el{" "}
                      <code className="text-zinc-500">.m3u8</code> para VLC o el visor;{" "}
                      <strong className="text-zinc-500">no</strong> es la URL RTMP de OBS.
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <code className="max-w-full flex-1 break-all rounded bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-200">
                        {hlsPlayUrl(m, editingCamera.ingestKey)}
                      </code>
                      <button
                        type="button"
                        onClick={() => void copyText(hlsPlayUrl(m, editingCamera.ingestKey!))}
                        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <label className="block">
              <span className="text-xs text-zinc-500">Tipo de stream</span>
              <select
                value={form.streamType}
                disabled={Boolean(form.useRtmpRelay || editingCamera?.ingestKey)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, streamType: e.target.value as StreamType }))
                }
                className="mt-1 w-full rounded-lg border border-surface-border bg-[#0f1117] px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
              >
                {STREAM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Orden</span>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))
                }
                className="mt-1 w-full rounded-lg border border-surface-border bg-[#0f1117] px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-surface-border"
              />
              <span className="text-sm text-zinc-300">Activa (visible en el visor público)</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-zinc-500">Descripción (opcional)</span>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-surface-border bg-[#0f1117] px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-zinc-500">Miniatura URL (opcional)</span>
              <input
                value={form.thumbnail}
                onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-surface-border bg-[#0f1117] px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                {editingId ? "Guardar cambios" : "Agregar cámara"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-surface-border px-4 py-2 text-sm text-zinc-300"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold text-zinc-200">Cámaras configuradas</h2>
          {loading ? (
            <p className="text-sm text-zinc-500">Cargando…</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-surface-border">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#0f1117] text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Orden</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">RTMP</th>
                    <th className="px-4 py-3">URL / fuente</th>
                    <th className="px-4 py-3">Activa</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {cameras.map((c) => (
                    <tr key={c.id} className="bg-surface-raised/40 hover:bg-surface-raised/60">
                      <td className="px-4 py-3 font-mono text-zinc-400">{c.order}</td>
                      <td className="px-4 py-3 font-medium text-zinc-100">{c.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{c.streamType}</td>
                      <td className="px-4 py-3">
                        {c.ingestKey ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                            relay
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-zinc-500">
                        {c.ingestKey ? `(HLS vía servidor)` : c.sourceUrl}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void toggleActive(c)}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.isActive
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-zinc-600/40 text-zinc-400"
                          }`}
                        >
                          {c.isActive ? "Sí" : "No"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!c.ingestKey && (
                          <button
                            type="button"
                            onClick={() => void enableRelay(c.id)}
                            className="mr-2 text-emerald-400 hover:underline"
                          >
                            RTMP
                          </button>
                        )}
                        {c.ingestKey && (
                          <button
                            type="button"
                            onClick={() => void rotateRelayKey(c.id)}
                            className="mr-2 text-amber-400/90 hover:underline"
                          >
                            Rotar clave
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="mr-2 text-cyan-400 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(c.id)}
                          className="text-red-400 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
