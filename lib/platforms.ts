import type { AnilistExternalLink, Platform } from "@/types";

export const PLATFORM_INFO: Record<
  Platform,
  { label: string; color: string; sites: string[] }
> = {
  netflix: {
    label: "Netflix",
    color: "#E50914",
    sites: ["Netflix"],
  },
  prime: {
    label: "Prime Video",
    color: "#00A8E0",
    sites: ["Amazon Prime Video", "Amazon", "Prime Video"],
  },
  "d-anime": {
    label: "dアニメ",
    color: "#D31F43",
    sites: ["dアニメストア", "d Anime Store", "dAnime"],
  },
  abema: {
    label: "ABEMA",
    color: "#00C4CC",
    sites: ["ABEMA", "AbemaTV"],
  },
  "u-next": {
    label: "U-NEXT",
    color: "#000000",
    sites: ["U-NEXT"],
  },
  crunchyroll: {
    label: "Crunchyroll",
    color: "#F47521",
    sites: ["Crunchyroll"],
  },
  hidive: {
    label: "HIDIVE",
    color: "#00ACED",
    sites: ["HIDIVE"],
  },
  disney: {
    label: "Disney+",
    color: "#113CCF",
    sites: ["Disney Plus", "Disney+"],
  },
  niconico: {
    label: "ニコニコ",
    color: "#E6000B",
    sites: ["niconico", "Nico Nico Douga"],
  },
  hulu: {
    label: "Hulu",
    color: "#3DBB3D",
    sites: ["Hulu"],
  },
  terrestrial: {
    label: "地上波",
    color: "#6B7280",
    sites: [],
  },
};

export function getAvailablePlatforms(
  links: AnilistExternalLink[]
): Platform[] {
  const streamingLinks = links.filter((l) => l.type === "STREAMING" || l.type === "INFO");
  return (Object.keys(PLATFORM_INFO) as Platform[]).filter((platform) =>
    PLATFORM_INFO[platform].sites.some((site) =>
      streamingLinks.some((l) =>
        l.site.toLowerCase().includes(site.toLowerCase()) ||
        site.toLowerCase().includes(l.site.toLowerCase())
      )
    )
  );
}

export function getWatchStatus(
  links: AnilistExternalLink[],
  subscriptions: Platform[]
): "watchable" | "unavailable" | "none" {
  const available = getAvailablePlatforms(links);
  if (!available.length) return "none";
  if (available.some((p) => subscriptions.includes(p))) return "watchable";
  return "unavailable";
}

export const DEFAULT_SUBSCRIPTIONS: Platform[] = ["crunchyroll"];
