"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AnilistMedia, StoredEntry, Platform } from "@/types";
import {
  getWatchlist,
  removeFromWatchlist,
  getEntrySeasonKey,
  seasonKeyLabel,
  updateEntrySeasonKey,
} from "@/lib/watchlist";
import { setRating, getAllRatings } from "@/lib/ratings";
import { getCachedMediaBatch, setCachedMediaBatch } from "@/lib/mediaCache";
import { getManualPlatforms } from "@/lib/manualPlatforms";
import { getWatchStatus, DEFAULT_SUBSCRIPTIONS } from "@/lib/platforms";
import { StarRating } from "@/components/StarRating";
import { PlatformEditor } from "@/components/PlatformEditor";
import { SeasonSelectModal } from "@/components/SeasonSelectModal";

type SortKey = "added_desc" | "added_asc" | "rating_desc" | "rating_asc";
type View = "season" | "unknown";

const SEASON_ORDER = ["WINTER", "SPRING", "SUMMER", "FALL"];

/** Minimal AnilistMedia shell for when media hasn't loaded yet */
function shellMedia(entry: StoredEntry): AnilistMedia {
  return {
    id: entry.mediaId,
    title: {
      romaji: entry.title.romaji,
      native: entry.title.native ?? entry.title.romaji,
      english: entry.title.english,
    },
    coverImage: { large: "", medium: "", color: null },
    bannerImage: null, genres: [], tags: [],
    studios: { nodes: [] },
    season: null, seasonYear: null, format: null, episodes: null,
    status: "", averageScore: null, meanScore: null, popularity: 0,
    description: null, nextAiringEpisode: null,
    airingSchedule: { nodes: [] },
    relations: { edges: [] },
    externalLinks: [], trailer: null, siteUrl: null,
    staff: { edges: [] }, characters: { edges: [] },
  };
}

export default function WatchlistPage() {
  const [entries, setEntries] = useState<StoredEntry[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<number, AnilistMedia>>(new Map());
  const [mediaLoading, setMediaLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<SortKey>("added_desc");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [view, setView] = useState<View>("season");
  const [editingPlatformId, setEditingPlatformId] = useState<number | null>(null);
  const [editingSeasonEntry, setEditingSeasonEntry] = useState<StoredEntry | null>(null);
  const [subscriptions, setSubscriptions] = useState<Platform[]>(DEFAULT_SUBSCRIPTIONS);

  const refresh = () => {
    const stored = getWatchlist();
    setEntries(stored);
    setRatings(getAllRatings());
  };

  useEffect(() => {
    try {
      const s = localStorage.getItem("anime-subscriptions");
      if (s) setSubscriptions(JSON.parse(s));
    } catch {}

    const stored = getWatchlist();
    setEntries(stored);
    setRatings(getAllRatings());

    if (!stored.length) return;

    const ids = stored.map((e) => e.mediaId);
    const { cached, missing } = getCachedMediaBatch(ids);
    setMediaMap(new Map(cached.map((m) => [m.id, m])));

    if (missing.length) {
      setMediaLoading(true);
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
        .catch(() => {})
        .finally(() => setMediaLoading(false));
    }

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const seasonedEntries = useMemo(
    () => entries.filter((e) => getEntrySeasonKey(e) !== "UNKNOWN"),
    [entries]
  );
  const unknownEntries = useMemo(
    () => entries.filter((e) => getEntrySeasonKey(e) === "UNKNOWN"),
    [entries]
  );

  const seasons = useMemo(() => {
    const keys = Array.from(new Set(seasonedEntries.map(getEntrySeasonKey)));
    return keys.sort((a, b) => {
      const [ay, as_] = a.split("-");
      const [by, bs] = b.split("-");
      if (ay !== by) return Number(by) - Number(ay);
      return SEASON_ORDER.indexOf(bs) - SEASON_ORDER.indexOf(as_);
    });
  }, [seasonedEntries]);

  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0]);
      setView("season");
    } else if (seasons.length === 0 && unknownEntries.length > 0) {
      setView("unknown");
    }
  }, [seasons, unknownEntries.length, selectedSeason]);

  const filteredEntries = useMemo(() => {
    const base =
      view === "unknown"
        ? unknownEntries
        : seasonedEntries.filter((e) => getEntrySeasonKey(e) === selectedSeason);
    return [...base].sort((a, b) => {
      switch (sort) {
        case "added_desc": return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case "added_asc":  return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case "rating_desc": return (ratings[b.mediaId] ?? 0) - (ratings[a.mediaId] ?? 0);
        case "rating_asc":  return (ratings[a.mediaId] ?? 0) - (ratings[b.mediaId] ?? 0);
        default: return 0;
      }
    });
  }, [view, unknownEntries, seasonedEntries, selectedSeason, sort, ratings]);

  const handleRating = (mediaId: number, value: number) => {
    setRating(mediaId, value);
    setRatings(getAllRatings());
  };

  const handleRemove = (mediaId: number) => {
    removeFromWatchlist(mediaId);
    refresh();
  };

  const handleSeasonChange = (entry: StoredEntry, seasonKey: string) => {
    updateEntrySeasonKey(entry.mediaId, seasonKey);
    setEditingSeasonEntry(null);
    refresh();
  };

  if (!entries.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-2">視聴リスト</h1>
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">📺</p>
          <p className="text-lg font-medium text-gray-300">視聴リストが空です</p>
          <p className="text-sm text-gray-500">「探す」でアニメを見つけて + ボタンで追加しましょう</p>
          <Link href="/seasonal" className="inline-block mt-2 px-5 py-2.5 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors">
            アニメを探す →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">視聴リスト</h1>
          <p className="text-sm text-gray-400 mt-0.5">{entries.length} 作品登録中</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {seasons.length > 0 && (
            <select
              value={view === "season" ? selectedSeason : ""}
              onChange={(e) => { setSelectedSeason(e.target.value); setView("season"); }}
              onClick={() => view === "unknown" && setView("season")}
              className={`appearance-none text-sm border rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors ${
                view === "season"
                  ? "bg-gray-800 border-gray-700 text-gray-300 focus:border-violet-500"
                  : "bg-gray-900 border-gray-800 text-gray-500"
              }`}
            >
              {seasons.map((k) => (
                <option key={k} value={k}>{seasonKeyLabel(k)}</option>
              ))}
            </select>
          )}

          {unknownEntries.length > 0 && (
            <button
              onClick={() => setView("unknown")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                view === "unknown"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
              }`}
            >
              クール未設定
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                view === "unknown" ? "bg-gray-600 text-gray-200" : "bg-gray-800 text-gray-500"
              }`}>
                {unknownEntries.length}
              </span>
            </button>
          )}

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="added_desc">追加順（新しい）</option>
            <option value="added_asc">追加順（古い）</option>
            <option value="rating_desc">評価順（高い）</option>
            <option value="rating_asc">評価順（低い）</option>
          </select>
        </div>
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2 flex-wrap">
        {view === "unknown" ? (
          <>
            <span className="text-sm font-semibold text-gray-400">クール未設定</span>
            <span className="text-sm text-gray-500">— {unknownEntries.length} 作品</span>
            <span className="text-xs text-gray-600">クールを設定するとダッシュボードやランキングに反映されます</span>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-violet-400">
              {selectedSeason ? seasonKeyLabel(selectedSeason) : ""}
            </span>
            <span className="text-sm text-gray-500">— {filteredEntries.length} 作品</span>
            {mediaLoading && <span className="text-xs text-gray-600">読み込み中…</span>}
          </>
        )}
      </div>

      {/* Entry list */}
      {filteredEntries.length === 0 ? (
        <p className="text-center py-12 text-gray-500">このクールの作品はありません</p>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => {
            const media = mediaMap.get(entry.mediaId);
            const isUnknown = getEntrySeasonKey(entry) === "UNKNOWN";
            const rating = ratings[entry.mediaId] ?? 0;
            const manualPlats = getManualPlatforms(entry.mediaId);

            // While media is loading, show compact skeleton card
            if (!media) {
              return (
                <div key={entry.mediaId} className="flex gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3">
                  <div className="w-14 shrink-0 rounded-lg bg-gray-800 animate-pulse" style={{ aspectRatio: "2/3" }} />
                  <div className="flex-1 space-y-2 py-1">
                    <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
                      {entry.title.native ?? entry.title.romaji}
                    </p>
                    <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-gray-800 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              );
            }

            const title = media.title.native ?? media.title.romaji;
            const watchStatus = getWatchStatus(media.externalLinks, subscriptions);
            const animStudios = media.studios.nodes.filter((s) => s.isAnimationStudio);

            return (
              <div
                key={entry.mediaId}
                className={`flex gap-3 bg-gray-900 border rounded-xl p-3 hover:border-gray-700 transition-colors ${
                  isUnknown ? "border-gray-700/70" : "border-gray-800"
                }`}
              >
                {/* Cover */}
                <div className="relative w-14 shrink-0 rounded-lg overflow-hidden bg-gray-800" style={{ aspectRatio: "2/3" }}>
                  <Image src={media.coverImage.medium} alt={title} fill className="object-cover" sizes="56px" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight line-clamp-2">{title}</p>
                      {media.title.romaji !== title && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{media.title.romaji}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(entry.mediaId)}
                      className="shrink-0 w-6 h-6 rounded-full bg-gray-800 hover:bg-red-900/50 text-gray-500 hover:text-red-400 flex items-center justify-center text-xs transition-colors"
                      title="リストから削除"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
                    {animStudios.length > 0 && <span>{animStudios[0].name}</span>}
                    {media.genres.slice(0, 2).map((g) => (
                      <span key={g} className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{g}</span>
                    ))}
                    {watchStatus === "watchable" && (
                      <span className="text-emerald-400 font-medium">▶ 視聴可</span>
                    )}
                    {watchStatus === "unavailable" && manualPlats === null && (
                      <span className="text-gray-500">🔒 要録画</span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <StarRating value={rating} onChange={(v) => handleRating(entry.mediaId, v)} size="sm" />
                    {media.siteUrl && (
                      <a href={media.siteUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                        AniList
                        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 10L10 2M10 2H5M10 2v5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* Secondary actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setEditingPlatformId(entry.mediaId)}
                      className="text-[10px] text-gray-600 hover:text-violet-400 transition-colors"
                    >
                      {manualPlats ? "✎ 配信設定あり" : "+ 配信サービスを設定"}
                    </button>
                    <button
                      onClick={() => setEditingSeasonEntry(entry)}
                      className={`text-[10px] transition-colors ${
                        isUnknown
                          ? "text-amber-500 hover:text-amber-300 font-medium"
                          : "text-gray-600 hover:text-violet-400"
                      }`}
                    >
                      {isUnknown ? "📅 クールを設定" : "✎ クールを変更"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Platform editor modal */}
      {editingPlatformId !== null && (() => {
        const entry = entries.find((e) => e.mediaId === editingPlatformId);
        if (!entry) return null;
        const title = mediaMap.get(entry.mediaId)?.title.native
          ?? entry.title.native
          ?? entry.title.romaji;
        return (
          <PlatformEditor
            mediaId={editingPlatformId}
            mediaTitle={title}
            onClose={() => { setEditingPlatformId(null); refresh(); }}
          />
        );
      })()}

      {/* Season select modal */}
      {editingSeasonEntry && (
        <SeasonSelectModal
          media={mediaMap.get(editingSeasonEntry.mediaId) ?? shellMedia(editingSeasonEntry)}
          initialSeasonKey={getEntrySeasonKey(editingSeasonEntry)}
          confirmLabel="変更"
          onClose={() => setEditingSeasonEntry(null)}
          onConfirm={(seasonKey) => handleSeasonChange(editingSeasonEntry, seasonKey)}
        />
      )}
    </div>
  );
}
