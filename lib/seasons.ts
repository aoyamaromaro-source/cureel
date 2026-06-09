import type { Season, SeasonInfo } from "@/types";

const SEASON_ORDER: Season[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
const SEASON_LABELS: Record<Season, string> = {
  WINTER: "冬",
  SPRING: "春",
  SUMMER: "夏",
  FALL: "秋",
};

export function getCurrentSeason(): SeasonInfo {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let season: Season;
  if (month <= 3) season = "WINTER";
  else if (month <= 6) season = "SPRING";
  else if (month <= 9) season = "SUMMER";
  else season = "FALL";
  return { season, year, label: `${year}年${SEASON_LABELS[season]}` };
}

export function getNextSeason(info: SeasonInfo): SeasonInfo {
  const idx = SEASON_ORDER.indexOf(info.season);
  const nextIdx = (idx + 1) % 4;
  const nextSeason = SEASON_ORDER[nextIdx];
  const nextYear = nextIdx === 0 ? info.year + 1 : info.year;
  return { season: nextSeason, year: nextYear, label: `${nextYear}年${SEASON_LABELS[nextSeason]}` };
}

export function getPrevSeason(info: SeasonInfo): SeasonInfo {
  const idx = SEASON_ORDER.indexOf(info.season);
  const prevIdx = (idx - 1 + 4) % 4;
  const prevSeason = SEASON_ORDER[prevIdx];
  const prevYear = prevIdx === 3 ? info.year - 1 : info.year;
  return { season: prevSeason, year: prevYear, label: `${prevYear}年${SEASON_LABELS[prevSeason]}` };
}

export function seasonLabel(season: Season): string {
  return SEASON_LABELS[season];
}
