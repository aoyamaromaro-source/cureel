import type { AnilistMedia } from "@/types";

const SESSION_KEY = "cureel-media-cache";

function readCache(): Record<string, AnilistMedia> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}") as Record<string, AnilistMedia>;
  } catch { return {}; }
}

export function getCachedMedia(id: number): AnilistMedia | null {
  return readCache()[String(id)] ?? null;
}

export function setCachedMediaBatch(medias: AnilistMedia[]): void {
  if (typeof window === "undefined") return;
  try {
    const cache = readCache();
    for (const m of medias) cache[String(m.id)] = m;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cache));
  } catch {}
}

export function getCachedMediaBatch(ids: number[]): { cached: AnilistMedia[]; missing: number[] } {
  const cache = readCache();
  const cached: AnilistMedia[] = [];
  const missing: number[] = [];
  for (const id of ids) {
    const m = cache[String(id)];
    if (m) cached.push(m);
    else missing.push(id);
  }
  return { cached, missing };
}
