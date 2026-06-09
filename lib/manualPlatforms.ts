import type { Platform } from "@/types";
import { safeGet, safeSet } from "./storage";

const KEY = "anime-manual-platforms";

type ManualMap = Record<string, Platform[]>;

function load(): ManualMap {
  return safeGet<ManualMap>(KEY, {});
}

export function getManualPlatforms(mediaId: number): Platform[] | null {
  return load()[String(mediaId)] ?? null;
}

export function setManualPlatforms(mediaId: number, platforms: Platform[]): void {
  const map = load();
  if (platforms.length === 0) {
    delete map[String(mediaId)];
  } else {
    map[String(mediaId)] = platforms;
  }
  safeSet(KEY, map);
}

export function clearManualPlatforms(mediaId: number): void {
  const map = load();
  delete map[String(mediaId)];
  safeSet(KEY, map);
}
