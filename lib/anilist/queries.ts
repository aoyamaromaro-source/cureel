export const MEDIA_FIELDS = /* GraphQL */ `
  id
  title { romaji native english }
  coverImage { large medium color }
  bannerImage
  genres
  tags { name rank category isAdult }
  studios { nodes { id name isAnimationStudio } }
  season
  seasonYear
  format
  episodes
  status
  averageScore
  meanScore
  popularity
  description(asHtml: false)
  nextAiringEpisode { airingAt episode }
  airingSchedule(notYetAired: true) { nodes { airingAt episode } }
  relations {
    edges {
      relationType(version: 2)
      node { id type title { romaji } coverImage { large medium color } }
    }
  }
  externalLinks { id site url type language color icon }
  trailer { id site thumbnail }
  siteUrl
  characters(perPage: 8, sort: [ROLE]) {
    edges {
      voiceActors(language: JAPANESE) {
        id
        name { full native }
        image { large }
        language
      }
      node {
        id
        name { full native }
        image { large }
      }
    }
  }
  staff(perPage: 12, sort: [RELEVANCE]) {
    edges {
      role
      node {
        id
        name { full native }
        image { large medium }
      }
    }
  }
`;

// format: TV で映画・OVA・ONA を除外
export const SEASONAL_ANIME_QUERY = /* GraphQL */ `
  query SeasonalAnime($season: MediaSeason, $seasonYear: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage total }
      media(
        season: $season
        seasonYear: $seasonYear
        type: ANIME
        format: TV
        sort: POPULARITY_DESC
        isAdult: false
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

// タイトル検索: format 制限なし（映画・OVA も見つけられるように）
export const SEARCH_ANIME_QUERY = /* GraphQL */ `
  query SearchAnime($search: String!, $page: Int) {
    Page(page: $page, perPage: 20) {
      media(
        search: $search
        type: ANIME
        sort: SEARCH_MATCH
        isAdult: false
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export const MEDIA_BY_IDS_QUERY = /* GraphQL */ `
  query MediaByIds($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;
