import type { AnilistMedia, StoredEntry } from "@/types";
import { safeGet, safeSet } from "./storage";

const KEY = "cureel-watchlist";
const OLD_KEY = "anime-watchlist";

function toStoredEntry(item: unknown): StoredEntry | null {
  if (!item || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;

  // New compact format: has mediaId number
  if (typeof obj.mediaId === "number") {
    const t = (obj.title as Record<string, unknown>) ?? {};
    return {
      mediaId: obj.mediaId,
      title: {
        romaji: (t.romaji as string) ?? "",
        native: (t.native as string | null) ?? null,
        english: (t.english as string | null) ?? null,
      },
      seasonKey:
        typeof obj.seasonKey === "string" && obj.seasonKey
          ? obj.seasonKey
          : "UNKNOWN",
      addedAt:
        typeof obj.addedAt === "string"
          ? obj.addedAt
          : new Date().toISOString(),
    };
  }

  // Old format: has media sub-object (AnilistMedia blob)
  if (obj.media && typeof obj.media === "object") {
    const m = obj.media as AnilistMedia;
    return {
      mediaId: m.id,
      title: {
        romaji: m.title.romaji,
        native: m.title.native ?? null,
        english: m.title.english ?? null,
      },
      seasonKey:
        typeof obj.seasonKey === "string" && obj.seasonKey
          ? obj.seasonKey
          : m.season && m.seasonYear
          ? `${m.seasonYear}-${m.season}`
          : "UNKNOWN",
      addedAt:
        typeof obj.addedAt === "string"
          ? obj.addedAt
          : new Date().toISOString(),
    };
  }

  return null;
}

export function getWatchlist(): StoredEntry[] {
  if (typeof window === "undefined") return [];
  if (!localStorage.getItem(KEY)) {
    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      try { localStorage.setItem(KEY, oldRaw); } catch {}
    }
  }
  const raw = safeGet<unknown[]>(KEY, []);
  if (!raw.length) return [];

  const entries = raw.map(toStoredEntry).filter(Boolean) as StoredEntry[];

  // If old format detected, persist the migrated compact version
  const first = raw[0] as Record<string, unknown>;
  if (first && typeof first.media === "object") {
    safeSet(KEY, entries);
  }

  return entries;
}

export function addToWatchlist(media: AnilistMedia, seasonKey?: string): void {
  const list = getWatchlist();
  if (list.some((e) => e.mediaId === media.id)) return;
  const key =
    seasonKey ??
    (media.season && media.seasonYear
      ? `${media.seasonYear}-${media.season}`
      : "UNKNOWN");
  list.push({
    mediaId: media.id,
    title: {
      romaji: media.title.romaji,
      native: media.title.native ?? null,
      english: media.title.english ?? null,
    },
    seasonKey: key,
    addedAt: new Date().toISOString(),
  });
  safeSet(KEY, list);
}

export function removeFromWatchlist(mediaId: number): void {
  safeSet(KEY, getWatchlist().filter((e) => e.mediaId !== mediaId));
}

export function isInWatchlist(mediaId: number): boolean {
  return getWatchlist().some((e) => e.mediaId === mediaId);
}

export function getEntrySeasonKey(entry: StoredEntry): string {
  return entry.seasonKey;
}

export function seasonKeyLabel(key: string): string {
  if (key === "UNKNOWN") return "クール未設定";
  const LABELS: Record<string, string> = {
    WINTER: "冬", SPRING: "春", SUMMER: "夏", FALL: "秋",
  };
  const [year, season] = key.split("-");
  return `${year}年${LABELS[season] ?? season}`;
}

export function updateEntrySeasonKey(mediaId: number, seasonKey: string): void {
  const list = getWatchlist().map((e) =>
    e.mediaId === mediaId ? { ...e, seasonKey } : e
  );
  safeSet(KEY, list);
}
