import { safeGet, safeSet } from "./storage";

const KEY = "anime-ratings";

type RatingMap = Record<string, number>;

function load(): RatingMap {
  const raw = safeGet<Record<string, unknown>>(KEY, {});
  const result: RatingMap = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v !== "number") continue;
    if (v >= 0 && v <= 5) {
      result[k] = Math.round(v * 10) / 10; // 0.1 刻みにスナップ
    }
  }
  return result;
}

export function getRating(mediaId: number): number {
  return load()[String(mediaId)] ?? 0;
}

export function setRating(mediaId: number, rating: number): void {
  const map = load();
  if (rating <= 0) {
    delete map[String(mediaId)];
  } else {
    map[String(mediaId)] = Math.round(Math.min(5, Math.max(0.1, rating)) * 10) / 10;
  }
  safeSet(KEY, map);
}

export function getAllRatings(): RatingMap {
  return load();
}
