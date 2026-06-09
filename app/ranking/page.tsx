"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { getWatchlist, getEntrySeasonKey, seasonKeyLabel } from "@/lib/watchlist";
import { getAllRatings } from "@/lib/ratings";
import { getCachedMediaBatch, setCachedMediaBatch } from "@/lib/mediaCache";
import { RatingDisplay } from "@/components/StarRating";
import type { AnilistMedia, StoredEntry } from "@/types";

type Tab = "season" | "year" | "all";

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_BADGE = [
  "bg-yellow-400/20 border-yellow-400/60 text-yellow-300",
  "bg-gray-400/20 border-gray-400/60 text-gray-300",
  "bg-orange-700/20 border-orange-600/60 text-orange-300",
  "bg-gray-800/40 border-gray-700/40 text-gray-500",
  "bg-gray-800/40 border-gray-700/40 text-gray-500",
];
const CARD_GRADIENT = [
  "from-yellow-900/30 via-gray-900/60 to-gray-900",
  "from-gray-600/20 via-gray-900/60 to-gray-900",
  "from-orange-900/25 via-gray-900/60 to-gray-900",
  "from-gray-800/40 via-gray-900/60 to-gray-900",
  "from-gray-800/40 via-gray-900/60 to-gray-900",
];

const SEASON_ORDER = ["WINTER", "SPRING", "SUMMER", "FALL"];

function sortedYears(entries: StoredEntry[]): number[] {
  const years = new Set<number>();
  for (const e of entries) {
    const year = parseInt(getEntrySeasonKey(e).split("-")[0], 10);
    if (!isNaN(year)) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

function sortedSeasons(entries: StoredEntry[]): string[] {
  const keys = Array.from(new Set(entries.map(getEntrySeasonKey)))
    .filter((k) => k !== "UNKNOWN");
  return keys.sort((a, b) => {
    const [ay, as_] = a.split("-");
    const [by, bs] = b.split("-");
    if (ay !== by) return Number(by) - Number(ay);
    return SEASON_ORDER.indexOf(bs) - SEASON_ORDER.indexOf(as_);
  });
}

interface RankedItem {
  entry: StoredEntry;
  media: AnilistMedia;
  rating: number;
}

function rank(
  entries: StoredEntry[],
  ratings: Record<string, number>,
  mediaMap: Map<number, AnilistMedia>,
  limit = 5
): RankedItem[] {
  return entries
    .filter((e) => mediaMap.has(e.mediaId))
    .map((e) => ({
      entry: e,
      media: mediaMap.get(e.mediaId)!,
      rating: ratings[e.mediaId] ?? 0,
    }))
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (
        (b.media.meanScore ?? b.media.averageScore ?? 0) -
        (a.media.meanScore ?? a.media.averageScore ?? 0)
      );
    })
    .slice(0, limit);
}

interface RankCardProps {
  item: RankedItem;
  rank: number;
  showSeason?: boolean;
  hero?: boolean;
}

function RankCard({ item, rank: r, showSeason, hero }: RankCardProps) {
  const { entry, media, rating } = item;
  const title = media.title.native ?? media.title.romaji;
  const animStudios = media.studios.nodes.filter((s) => s.isAnimationStudio);
  const seasonTag = showSeason ? seasonKeyLabel(getEntrySeasonKey(entry)) : null;

  if (hero && r === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-yellow-500/30 shadow-2xl shadow-yellow-900/20">
        <div className="absolute inset-0">
          <Image src={media.coverImage.large} alt="" fill className="object-cover scale-110 blur-xl opacity-30" sizes="100vw" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/30" />
        </div>
        <div className="relative flex gap-5 p-5">
          <div className="relative shrink-0 rounded-xl overflow-hidden shadow-2xl ring-2 ring-yellow-500/40" style={{ width: 88, aspectRatio: "2/3" }}>
            <Image src={media.coverImage.large} alt={title} fill className="object-cover" sizes="88px" />
          </div>
          <div className="flex-1 min-w-0 space-y-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥇</span>
              <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">1st Place</span>
              {seasonTag && (
                <span className="ml-auto text-[10px] bg-yellow-500/15 text-yellow-400/80 px-2 py-0.5 rounded-full border border-yellow-500/20">{seasonTag}</span>
              )}
            </div>
            <p className="text-lg font-black text-white leading-tight line-clamp-2">{title}</p>
            {media.title.romaji !== title && (
              <p className="text-xs text-gray-400 line-clamp-1">{media.title.romaji}</p>
            )}
            <RatingDisplay value={rating} size="lg" />
            <div className="flex flex-wrap gap-1 mt-1">
              {media.genres.slice(0, 4).map((g) => (
                <span key={g} className="text-[10px] bg-gray-800/60 text-gray-400 px-1.5 py-0.5 rounded">{g}</span>
              ))}
            </div>
            {animStudios[0] && <p className="text-[11px] text-gray-500">{animStudios[0].name}</p>}
          </div>
        </div>
        <div className="absolute right-4 bottom-2 text-[80px] font-black text-white/5 select-none pointer-events-none leading-none">1</div>
      </div>
    );
  }

  return (
    <div className={`relative flex gap-4 bg-gradient-to-r ${CARD_GRADIENT[r] ?? CARD_GRADIENT[4]} border border-gray-800/60 rounded-2xl p-4 overflow-hidden`}>
      <div className="shrink-0 flex flex-col items-center justify-center" style={{ width: 36 }}>
        {r < 3 ? (
          <span className="text-2xl leading-none">{MEDALS[r]}</span>
        ) : (
          <span className={`w-8 h-8 rounded-full border text-xs font-black flex items-center justify-center ${RANK_BADGE[r] ?? RANK_BADGE[4]}`}>
            {r + 1}
          </span>
        )}
      </div>
      <div className="relative shrink-0 rounded-xl overflow-hidden shadow-lg" style={{ width: 56, aspectRatio: "2/3" }}>
        <Image src={media.coverImage.large} alt={title} fill className="object-cover" sizes="56px" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-white leading-tight line-clamp-2 flex-1">{title}</p>
          {seasonTag && (
            <span className="shrink-0 text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-700 whitespace-nowrap">{seasonTag}</span>
          )}
        </div>
        {media.title.romaji !== title && (
          <p className="text-[11px] text-gray-500 line-clamp-1">{media.title.romaji}</p>
        )}
        <RatingDisplay value={rating} size="md" />
        <div className="flex flex-wrap gap-1">
          {media.genres.slice(0, 3).map((g) => (
            <span key={g} className="text-[10px] bg-gray-800/80 text-gray-400 px-1.5 py-0.5 rounded">{g}</span>
          ))}
        </div>
        {animStudios[0] && <p className="text-[10px] text-gray-500">{animStudios[0].name}</p>}
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[64px] font-black text-white/4 select-none pointer-events-none leading-none">{r + 1}</div>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="text-center py-20 space-y-3">
      <p className="text-4xl">{icon}</p>
      <p className="text-lg font-medium text-gray-300">{title}</p>
      {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

export default function RankingPage() {
  const [tab, setTab] = useState<Tab>("season");
  const [entries, setEntries] = useState<StoredEntry[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<number, AnilistMedia>>(new Map());
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(0);

  useEffect(() => {
    const stored = getWatchlist();
    setEntries(stored);
    setRatings(getAllRatings());

    if (!stored.length) return;
    const ids = stored.map((e) => e.mediaId);
    const { cached, missing } = getCachedMediaBatch(ids);
    setMediaMap(new Map(cached.map((m) => [m.id, m])));

    if (missing.length) {
      fetch(`/api/media?ids=${missing.join(",")}`)
        .then((r) => r.json())
        .then((data) => {
          const fetched: AnilistMedia[] = data.media ?? [];
          setCachedMediaBatch(fetched);
          setMediaMap((prev) => {
            const next = new Map(prev);
            for (const m of fetched) next.set(m.id, m);
            return next;
          });
        })
        .catch(() => {});
    }

    const reload = () => { setEntries(getWatchlist()); setRatings(getAllRatings()); };
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

  const seasons = useMemo(() => sortedSeasons(entries), [entries]);
  const years = useMemo(() => sortedYears(entries), [entries]);

  useEffect(() => {
    if (seasons.length && !selectedSeason) setSelectedSeason(seasons[0]);
  }, [seasons, selectedSeason]);

  useEffect(() => {
    if (years.length && !selectedYear) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  const rankedSeason = useMemo(
    () => rank(entries.filter((e) => getEntrySeasonKey(e) === selectedSeason), ratings, mediaMap),
    [entries, ratings, mediaMap, selectedSeason]
  );
  const rankedYear = useMemo(
    () => rank(
      entries.filter((e) => parseInt(getEntrySeasonKey(e).split("-")[0], 10) === selectedYear),
      ratings, mediaMap
    ),
    [entries, ratings, mediaMap, selectedYear]
  );
  const rankedAll = useMemo(() => rank(entries, ratings, mediaMap, 10), [entries, ratings, mediaMap]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "season", label: "クール別" },
    { id: "year", label: "年度別" },
    { id: "all", label: "総合" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">ランキング</h1>
        <p className="text-sm text-gray-400 mt-0.5">評価の高いアニメ</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? "bg-violet-700 text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* クール別 */}
      {tab === "season" && (
        <>
          {!entries.length ? (
            <EmptyState icon="🏆" title="まだ視聴リストが空です" sub={"「探す」でアニメを追加し、視聴リストで星評価をつけると\nランキングが表示されます"} />
          ) : seasons.length === 0 ? (
            <EmptyState icon="📭" title="シーズン情報がありません" />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">クールを選択</p>
                <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}
                  className="appearance-none text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-1.5 outline-none focus:border-violet-500 cursor-pointer font-semibold">
                  {seasons.map((k) => <option key={k} value={k}>{seasonKeyLabel(k)}</option>)}
                </select>
              </div>
              {rankedSeason.length === 0 ? (
                <EmptyState icon="📭" title="このクールの登録作品はありません" />
              ) : (
                <div className="space-y-3">
                  {rankedSeason.map((item, i) => (
                    <RankCard key={item.entry.mediaId} item={item} rank={i} hero />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 年度別 */}
      {tab === "year" && (
        <>
          {!entries.length ? (
            <EmptyState icon="🏆" title="まだ視聴リストが空です" />
          ) : years.length === 0 ? (
            <EmptyState icon="📭" title="年度情報がありません" />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">年度を選択</p>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-1.5 outline-none focus:border-violet-500 cursor-pointer font-semibold">
                  {years.map((y) => <option key={y} value={y}>{y}年</option>)}
                </select>
              </div>
              {rankedYear.length === 0 ? (
                <EmptyState icon="📭" title="この年度の登録作品はありません" />
              ) : (
                <div className="space-y-3">
                  {rankedYear.map((item, i) => (
                    <RankCard key={item.entry.mediaId} item={item} rank={i} showSeason hero />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 総合 */}
      {tab === "all" && (
        <>
          {!entries.length ? (
            <EmptyState icon="🏆" title="まだ視聴リストが空です" />
          ) : rankedAll.length === 0 ? (
            <EmptyState icon="📭" title="登録作品がありません" />
          ) : (
            <div className="space-y-3">
              {rankedAll.map((item, i) => (
                <RankCard key={item.entry.mediaId} item={item} rank={i} showSeason hero />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
