export const SEASON_META = {
  WINTER: { label: "冬", months: "1〜3月", color: "from-blue-900/40 to-blue-950/60", border: "border-blue-800/40", badge: "bg-blue-800/50 text-blue-300" },
  SPRING: { label: "春", months: "4〜6月", color: "from-pink-900/40 to-pink-950/60", border: "border-pink-800/40", badge: "bg-pink-800/50 text-pink-300" },
  SUMMER: { label: "夏", months: "7〜9月", color: "from-amber-900/40 to-amber-950/60", border: "border-amber-800/40", badge: "bg-amber-800/50 text-amber-300" },
  FALL:   { label: "秋", months: "10〜12月", color: "from-orange-900/40 to-orange-950/60", border: "border-orange-800/40", badge: "bg-orange-800/50 text-orange-300" },
} as const;

export type SeasonCode = keyof typeof SEASON_META;

export const SEASONS = (Object.keys(SEASON_META) as SeasonCode[]).map((key) => ({
  key,
  ...SEASON_META[key],
}));

export function isSeasonCode(v: string): v is SeasonCode {
  return v in SEASON_META;
}

/** Parses "YYYY-SEASON" into { year, season } or null if invalid. */
export function parseSeasonKey(key: string): { year: number; season: SeasonCode } | null {
  const [yearStr, seasonStr] = key.split("-");
  const year = parseInt(yearStr, 10);
  if (isNaN(year) || !seasonStr || !isSeasonCode(seasonStr)) return null;
  return { year, season: seasonStr };
}
