import { SEASONAL_ANIME_QUERY, SEARCH_ANIME_QUERY, MEDIA_BY_IDS_QUERY } from "./queries";
import type { AnilistMedia, Season } from "@/types";

const ANILIST_URL = "https://graphql.anilist.co";

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

export async function fetchSeasonalAnime(
  season: Season,
  year: number
): Promise<AnilistMedia[]> {
  const data = await gql<{ Page: { media: AnilistMedia[] } }>(
    SEASONAL_ANIME_QUERY,
    { season, seasonYear: year, page: 1 }
  );
  return data.Page.media;
}

export async function fetchSearchAnime(search: string): Promise<AnilistMedia[]> {
  if (!search.trim()) return [];
  const data = await gql<{ Page: { media: AnilistMedia[] } }>(
    SEARCH_ANIME_QUERY,
    { search: search.trim(), page: 1 }
  );
  return data.Page.media;
}

export async function fetchMediaByIds(ids: number[]): Promise<AnilistMedia[]> {
  if (!ids.length) return [];
  const data = await gql<{ Page: { media: AnilistMedia[] } }>(
    MEDIA_BY_IDS_QUERY,
    { ids }
  );
  return data.Page.media;
}
