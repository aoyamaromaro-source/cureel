export type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface AnilistTitle {
  romaji: string;
  native: string;
  english: string | null;
}

export interface AnilistCoverImage {
  large: string;
  medium: string;
  color: string | null;
}

export interface AnilistTag {
  name: string;
  rank: number;
  category: string;
  isAdult: boolean;
}

export interface AnilistStudio {
  id: number;
  name: string;
  isAnimationStudio: boolean;
}

export interface AnilistExternalLink {
  id: number;
  site: string;
  url: string;
  type: string;
  language: string | null;
  color: string | null;
  icon: string | null;
}

export interface AnilistAiringEpisode {
  airingAt: number;
  episode: number;
}

export interface AnilistVoiceActor {
  id: number;
  name: { full: string; native: string | null };
  image: { large: string } | null;
  language: string;
}

export interface AnilistCharacter {
  id: number;
  name: { full: string; native: string | null };
  image: { large: string } | null;
}

export interface AnilistCharacterEdge {
  node: AnilistCharacter;
  voiceActors: AnilistVoiceActor[];
}

export interface AnilistStaffName {
  full: string;
  native: string | null;
}

export interface AnilistStaffMember {
  id: number;
  name: AnilistStaffName;
  image: { large: string; medium: string } | null;
}

export interface AnilistStaffEdge {
  role: string;
  node: AnilistStaffMember;
}

export interface AnilistRelationEdge {
  relationType: string;
  node: {
    id: number;
    type: string;
    title: AnilistTitle;
    coverImage: AnilistCoverImage;
  };
}

export interface AnilistTrailer {
  id: string;
  site: string;
  thumbnail: string | null;
}

export interface AnilistMedia {
  id: number;
  title: AnilistTitle;
  coverImage: AnilistCoverImage;
  bannerImage: string | null;
  genres: string[];
  tags: AnilistTag[];
  studios: { nodes: AnilistStudio[] };
  season: Season | null;
  seasonYear: number | null;
  format: string | null;
  episodes: number | null;
  status: string;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number;
  description: string | null;
  nextAiringEpisode: AnilistAiringEpisode | null;
  airingSchedule: { nodes: AnilistAiringEpisode[] };
  relations: { edges: AnilistRelationEdge[] };
  externalLinks: AnilistExternalLink[];
  trailer: AnilistTrailer | null;
  siteUrl: string | null;
  staff: { edges: AnilistStaffEdge[] };
  characters: { edges: AnilistCharacterEdge[] };
}

export interface WatchlistEntry {
  media: AnilistMedia;
  addedAt: string;
  seasonKey?: string;
}

/** Compact format stored in localStorage — no large AniList blobs */
export interface StoredEntry {
  mediaId: number;
  title: { romaji: string; native: string | null; english: string | null };
  /** "YYYY-SEASON" or "UNKNOWN" — always set */
  seasonKey: string;
  addedAt: string;
}

export interface SeasonInfo {
  season: Season;
  year: number;
  label: string;
}

export type Platform =
  | "netflix"
  | "prime"
  | "d-anime"
  | "abema"
  | "u-next"
  | "crunchyroll"
  | "hidive"
  | "disney"
  | "niconico"
  | "hulu"
  | "terrestrial";
