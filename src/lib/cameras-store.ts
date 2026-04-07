import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import {
  DEFAULT_CASTR_PLAYER_URL,
  DEFAULT_TWITCH_CHANNEL_URL,
  SECOND_TWITCH_CHANNEL_URL,
} from "@/lib/default-twitch";
import { newCameraId, newIngestKey } from "./id";
import type { CameraInput, CameraRecord, PublicCamera, StreamType } from "./types/camera";

const STREAM_TYPES: StreamType[] = ["hls", "rtsp", "mjpeg", "iframe", "unknown"];

function coerceStreamType(v: unknown): StreamType {
  return typeof v === "string" && STREAM_TYPES.includes(v as StreamType) ? (v as StreamType) : "unknown";
}

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "cameras.json");
/** Respaldo versionado para despliegues (p. ej. Vercel) donde no existe `cameras.json` local. */
const SEED_FILE = join(DATA_DIR, "cameras.seed.json");

type StoreShape = { cameras: Record<string, CameraRecord> };

let memory: StoreShape = { cameras: {} };
let loaded = false;
let writeChain: Promise<void> = Promise.resolve();

/** Evita crash si el archivo tiene BOM, espacios o JSON pegado dos veces (parse falla → null). */
function tryParseCamerasJson(raw: string): unknown | null {
  const s = raw.replace(/^\uFEFF/, "").trim();
  if (!s) return null;
  try {
    return JSON.parse(s) as unknown;
  } catch (e) {
    console.warn("[cameras-store] JSON inválido en data/cameras.json o seed — se usará el siguiente recurso o datos demo.", e);
    return null;
  }
}

/** Evita crash si el JSON tiene cameras: null, array u objeto inválido (typeof null === "object"). */
function normalizeCamerasFromFile(parsed: unknown): Record<string, CameraRecord> {
  if (!parsed || typeof parsed !== "object") return {};
  const raw = (parsed as { cameras?: unknown }).cameras;
  if (raw === null || raw === undefined) return {};
  if (Array.isArray(raw)) return {};
  if (typeof raw !== "object") return {};
  const out: Record<string, CameraRecord> = {};
  for (const [id, rec] of Object.entries(raw)) {
    if (!rec || typeof rec !== "object") continue;
    const r = rec as Partial<CameraRecord>;
    if (typeof r.name !== "string") continue;
    const ingestKey =
      typeof r.ingestKey === "string" && r.ingestKey.trim() ? r.ingestKey.trim() : undefined;
    const sourceUrl = typeof r.sourceUrl === "string" ? r.sourceUrl : "";
    if (!ingestKey && !sourceUrl.trim()) continue;
    const now = new Date().toISOString();
    const safe: CameraRecord = {
      id: typeof r.id === "string" ? r.id : id,
      name: r.name,
      sourceUrl,
      ...(ingestKey ? { ingestKey } : {}),
      isActive: typeof r.isActive === "boolean" ? r.isActive : true,
      order: typeof r.order === "number" && Number.isFinite(r.order) ? r.order : 0,
      description: typeof r.description === "string" ? r.description : undefined,
      thumbnail: typeof r.thumbnail === "string" ? r.thumbnail : undefined,
      streamType: coerceStreamType(r.streamType),
      createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
      updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : now,
    };
    out[safe.id] = safe;
  }
  return out;
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  let parsed: unknown | null = null;
  for (const file of [DATA_FILE, SEED_FILE]) {
    try {
      const raw = await readFile(file, "utf8");
      parsed = tryParseCamerasJson(raw);
      if (parsed !== null) break;
    } catch {
      /* archivo ausente o no legible — siguiente */
    }
  }
  if (parsed) {
    memory = { cameras: normalizeCamerasFromFile(parsed) };
  } else {
    memory = { cameras: {} };
  }
  if (Object.keys(memory.cameras).length === 0) {
    await seedDemoCameras();
  }
  loaded = true;
}

async function seedDemoCameras(): Promise<void> {
  const now = new Date().toISOString();
  /** Cámara principal: Castr (embed iframe). */
  const c0: CameraRecord = {
    id: newCameraId(),
    name: "Castr — turbostream",
    sourceUrl: DEFAULT_CASTR_PLAYER_URL,
    isActive: true,
    order: 0,
    description: "Transmisión principal (player Castr).",
    streamType: "iframe",
    createdAt: now,
    updatedAt: now,
  };
  const c1: CameraRecord = {
    id: newCameraId(),
    name: "Twitch — felipe_maldonado2",
    sourceUrl: DEFAULT_TWITCH_CHANNEL_URL,
    isActive: true,
    order: 1,
    description: "Embed oficial Twitch.",
    streamType: "iframe",
    createdAt: now,
    updatedAt: now,
  };
  const c2: CameraRecord = {
    id: newCameraId(),
    name: "Twitch — felipe_maldonado123",
    sourceUrl: SECOND_TWITCH_CHANNEL_URL,
    isActive: true,
    order: 2,
    description: "Segundo canal Twitch (visor).",
    streamType: "iframe",
    createdAt: now,
    updatedAt: now,
  };
  memory.cameras[c0.id] = c0;
  memory.cameras[c1.id] = c1;
  memory.cameras[c2.id] = c2;
  queuePersist();
  await flushPersist();
}

async function persist(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(memory, null, 2), "utf8");
  } catch (e) {
    console.warn(
      "[cameras-store] No se pudo escribir data/cameras.json (filesystem de solo lectura o serverless):",
      e
    );
  }
}

function queuePersist(): void {
  writeChain = writeChain.then(() => persist());
}

/** Espera a que termine la escritura en disco (evita perder datos si el cliente recarga enseguida). */
async function flushPersist(): Promise<void> {
  await writeChain;
}

function toPublic(c: CameraRecord): PublicCamera {
  return {
    id: c.id,
    name: String(c.name ?? ""),
    order: typeof c.order === "number" ? c.order : 0,
    description: c.description,
    thumbnail: c.thumbnail,
    streamType: coerceStreamType(c.streamType),
  };
}

export async function listCameras(): Promise<CameraRecord[]> {
  await ensureLoaded();
  const list = Object.values(memory.cameras ?? {});
  return list.sort((a, b) => {
    const ao = typeof a.order === "number" ? a.order : 0;
    const bo = typeof b.order === "number" ? b.order : 0;
    if (ao !== bo) return ao - bo;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });
}

export async function listPublicCameras(): Promise<PublicCamera[]> {
  const all = await listCameras();
  return all.filter((c) => c.isActive).map(toPublic);
}

export async function getCameraById(id: string): Promise<CameraRecord | undefined> {
  await ensureLoaded();
  return memory.cameras[id];
}

export async function createCamera(input: CameraInput): Promise<CameraRecord> {
  await ensureLoaded();
  const now = new Date().toISOString();
  const id = newCameraId();
  const useRelay = Boolean(input.useRtmpIngest);
  const ingestKey = useRelay ? newIngestKey() : undefined;
  const rec: CameraRecord = {
    id,
    name: input.name.trim() || "Sin nombre",
    sourceUrl: useRelay ? "" : input.sourceUrl.trim(),
    ...(ingestKey ? { ingestKey } : {}),
    isActive: input.isActive,
    order: Number.isFinite(input.order) ? input.order : 0,
    description: input.description?.trim() || undefined,
    thumbnail: input.thumbnail?.trim() || undefined,
    streamType: useRelay ? "hls" : input.streamType,
    createdAt: now,
    updatedAt: now,
  };
  memory.cameras[id] = rec;
  queuePersist();
  await flushPersist();
  return rec;
}

export async function updateCamera(id: string, input: Partial<CameraInput>): Promise<CameraRecord | undefined> {
  await ensureLoaded();
  const existing = memory.cameras[id];
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const next: CameraRecord = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() || "Sin nombre" : existing.name,
    sourceUrl: input.sourceUrl !== undefined ? input.sourceUrl.trim() : existing.sourceUrl,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    order: input.order !== undefined ? (Number.isFinite(input.order) ? input.order : existing.order) : existing.order,
    description:
      input.description !== undefined ? input.description.trim() || undefined : existing.description,
    thumbnail: input.thumbnail !== undefined ? input.thumbnail.trim() || undefined : existing.thumbnail,
    streamType: input.streamType !== undefined ? input.streamType : existing.streamType,
    updatedAt: now,
  };
  memory.cameras[id] = next;
  queuePersist();
  await flushPersist();
  return next;
}

export async function deleteCamera(id: string): Promise<boolean> {
  await ensureLoaded();
  if (!memory.cameras[id]) return false;
  delete memory.cameras[id];
  queuePersist();
  await flushPersist();
  return true;
}

export async function rotateIngestKey(id: string): Promise<CameraRecord | undefined> {
  await ensureLoaded();
  const existing = memory.cameras[id];
  if (!existing?.ingestKey) return undefined;
  const now = new Date().toISOString();
  const next: CameraRecord = {
    ...existing,
    ingestKey: newIngestKey(),
    updatedAt: now,
  };
  memory.cameras[id] = next;
  queuePersist();
  await flushPersist();
  return next;
}

/** Activa relay RTMP→HLS: genera clave y fuerza reproducción HLS en el visor. */
export async function enableRtmpRelay(id: string): Promise<CameraRecord | undefined> {
  await ensureLoaded();
  const existing = memory.cameras[id];
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const next: CameraRecord = {
    ...existing,
    ingestKey: existing.ingestKey ?? newIngestKey(),
    sourceUrl: "",
    streamType: "hls",
    updatedAt: now,
  };
  memory.cameras[id] = next;
  queuePersist();
  await flushPersist();
  return next;
}

/**
 * Reemplaza todo el almacén con los registros enviados (p. ej. restaurar copia local en demo/serverless).
 */
export async function importCameras(records: unknown[]): Promise<{ count: number }> {
  await ensureLoaded();
  const obj: Record<string, unknown> = {};
  for (const r of records) {
    if (!r || typeof r !== "object") continue;
    const id = typeof (r as { id?: unknown }).id === "string" ? (r as { id: string }).id : "";
    if (!id) continue;
    obj[id] = r;
  }
  memory.cameras = normalizeCamerasFromFile({ cameras: obj });
  queuePersist();
  await flushPersist();
  return { count: Object.keys(memory.cameras).length };
}
