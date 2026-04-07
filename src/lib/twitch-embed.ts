/**
 * Twitch exige embed con https://player.twitch.tv/?channel=...&parent=<tu_dominio>
 * (la URL del canal sola no funciona bien en <iframe>).
 */

/** Nombres de usuario Twitch: típicamente 4–25 caracteres; aceptamos 3+ por cuentas antiguas. */
const TWITCH_LOGIN = /^[a-zA-Z0-9_]{3,25}$/;

export function parseTwitchChannelFromUrl(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  /** Canal suelto (p. ej. `monstercat`) sin https — mismo uso que en admin. */
  if (!/^https?:\/\//i.test(s) && TWITCH_LOGIN.test(s)) return s.toLowerCase();
  try {
    const u = new URL(s);
    if (u.hostname === "player.twitch.tv") {
      const ch = u.searchParams.get("channel")?.trim();
      return ch || null;
    }
    if (
      u.hostname === "www.twitch.tv" ||
      u.hostname === "twitch.tv" ||
      u.hostname === "m.twitch.tv" ||
      u.hostname.endsWith(".twitch.tv")
    ) {
      const reserved = new Set([
        "",
        "directory",
        "downloads",
        "settings",
        "videos",
        "clips",
        "clip",
        "collections",
        "search",
        "p",
      ]);
      const first = u.pathname.replace(/^\//, "").split("/").filter(Boolean)[0];
      if (!first || reserved.has(first.toLowerCase())) return null;
      return decodeURIComponent(first);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Twitch permite repetir `parent` para varios dominios (útil: con/sin www, preview de Vercel, etc.).
 */
export function buildTwitchPlayerUrl(channel: string, parentHosts: string[]): string {
  const params = new URLSearchParams();
  params.set("channel", channel);
  const seen = new Set<string>();
  for (const h of parentHosts) {
    const clean = h.trim().toLowerCase().split(":")[0];
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    params.append("parent", clean);
  }
  if (seen.size === 0) params.append("parent", "localhost");
  return `https://player.twitch.tv/?${params.toString()}`;
}

/**
 * Hosts permitidos como `parent` para el iframe (cabeceras del request + env opcional).
 */
export function collectParentHostsForEmbed(request: Request): string[] {
  const raw =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost";
  const firstHost = raw.split(",")[0].trim().split(":")[0];
  const out = new Set<string>();

  const add = (h: string) => {
    const x = h.trim().toLowerCase().split(":")[0];
    if (x) out.add(x);
  };

  add(firstHost);
  if (firstHost.startsWith("www.")) add(firstHost.slice(4));
  else if (
    firstHost !== "localhost" &&
    firstHost !== "127.0.0.1" &&
    !/^\d+\.\d+\.\d+\.\d+$/.test(firstHost)
  ) {
    add(`www.${firstHost}`);
  }

  const extra = process.env.TWITCH_EMBED_EXTRA_PARENTS ?? "";
  for (const part of extra.split(",")) add(part);

  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    try {
      const u = new URL(vercel.startsWith("http") ? vercel : `https://${vercel}`);
      add(u.hostname);
    } catch {
      add(vercel.replace(/^https?:\/\//i, "").split("/")[0]);
    }
  }

  return [...out];
}
