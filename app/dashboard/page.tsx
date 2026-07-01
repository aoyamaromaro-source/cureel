"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getWatchlist, getEntrySeasonKey } from "@/lib/watchlist";
import { getAllRatings } from "@/lib/ratings";
import { getCachedMediaBatch, setCachedMediaBatch } from "@/lib/mediaCache";
import { RatingDisplay } from "@/components/StarRating";
import { SEASONS } from "@/lib/seasonMeta";
import type { AnilistMedia, StoredEntry } from "@/types";

export default function DashboardPage() {
  const [entries, setEntries] = useState<StoredEntry[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<number, AnilistMedia>>(new Map());
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [hovered, setHovered] = useState<number | null>(null);

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

    const onFocus = () => {
      setEntries(getWatchlist());
      setRatings(getAllRatings());
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const yearEntries = useMemo(
    () => entries.filter((e) => getEntrySeasonKey(e).startsWith(`${year}-`)),
    [entries, year]
  );

  const bySeasonKey = useMemo(() => {
    const map = new Map<string, StoredEntry[]>();
    for (const entry of yearEntries) {
      const k = getEntrySeasonKey(entry);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(entry);
    }
    return map;
  }, [yearEntries]);

  const stats = useMemo(() => {
    const total = yearEntries.length;
    const genreCount: Record<string, number> = {};
    let ratingSum = 0, ratingCount = 0;
    for (const e of yearEntries) {
      const media = mediaMap.get(e.mediaId);
      if (media) {
        for (const g of media.genres) genreCount[g] = (genreCount[g] ?? 0) + 1;
      }
      const r = ratings[e.mediaId];
      if (r) { ratingSum += r; ratingCount++; }
    }
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const avgRating = ratingCount ? (ratingSum / ratingCount).toFixed(1) : null;
    return { total, topGenre, avgRating };
  }, [yearEntries, ratings, mediaMap]);

  const availableYears = useMemo(() => {
    const ys = new Set<number>();
    for (const e of entries) {
      const y = parseInt(getEntrySeasonKey(e).split("-")[0]);
      if (!isNaN(y)) ys.add(y);
    }
    ys.add(new Date().getFullYear());
    return Array.from(ys).sort((a, b) => b - a);
  }, [entries]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">年間ダッシュボード</h1>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="appearance-none text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-violet-500 cursor-pointer font-semibold"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
      </div>

      {/* Compact stats bar */}
      <div className="flex divide-x divide-gray-800 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <CompactStat icon="📺" label="視聴本数" value={`${stats.total}本`} />
        <CompactStat icon="🎭" label="最多ジャンル" value={stats.topGenre ?? "—"} />
        <CompactStat icon="⭐" label="平均評価" value={stats.avgRating ? `${stats.avgRating}/5` : "—"} />
      </div>

      {/* Season sections */}
      <div className="space-y-2">
        {SEASONS.map((s) => {
          const key = `${year}-${s.key}`;
          const sEntries = bySeasonKey.get(key) ?? [];

          return (
            <section
              key={s.key}
              className={`rounded-xl border ${s.border} bg-gradient-to-b ${s.color} overflow-hidden`}
            >
              {/* Compact season header */}
              {sEntries.length > 0 ? (
                <Link
                  href={`/dashboard/${key}`}
                  className="px-4 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors"
                  title="クールのサマリーを見る"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                    {s.label}クール
                  </span>
                  <span className="text-xs text-gray-500">{s.months}</span>
                  <span className="ml-auto text-xs text-gray-500 font-medium">{sEntries.length}作品</span>
                  <span className="text-gray-500 text-xs" aria-hidden>›</span>
                </Link>
              ) : (
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                    {s.label}クール
                  </span>
                  <span className="text-xs text-gray-500">{s.months}</span>
                  <span className="ml-auto text-xs text-gray-500 font-medium">{sEntries.length}作品</span>
                </div>
              )}

              {/* Single-row horizontal scroll cover strip */}
              {sEntries.length === 0 ? (
                <div className="px-4 pb-3 text-xs text-gray-600 italic">登録作品なし</div>
              ) : (
                <div className="px-3 pb-3">
                  <div className="flex gap-2 overflow-x-auto scrollbar-none">
                    {sEntries.map((entry) => {
                      const media = mediaMap.get(entry.mediaId);
                      const title = media?.title.native ?? media?.title.romaji ?? entry.title.native ?? entry.title.romaji;
                      const rating = ratings[entry.mediaId] ?? 0;

                      return (
                        <div
                          key={entry.mediaId}
                          className="relative group cursor-default shrink-0"
                          onMouseEnter={() => setHovered(entry.mediaId)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <div
                            className="relative rounded-lg overflow-hidden border border-white/10 group-hover:border-white/40 transition-all group-hover:scale-105 group-hover:z-10 shadow-md bg-gray-800"
                            style={{ width: 52, aspectRatio: "2/3" }}
                          >
                            {media ? (
                              <Image
                                src={media.coverImage.large}
                                alt={title}
                                fill
                                className="object-cover"
                                sizes="52px"
                              />
                            ) : (
                              <div className="w-full h-full animate-pulse bg-gray-700" />
                            )}
                            {rating > 0 && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/70 flex items-center justify-center py-0.5">
                                <RatingDisplay value={rating} size="sm" />
                              </div>
                            )}
                          </div>

                          {/* Hover popup */}
                          {hovered === entry.mediaId && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2.5 pointer-events-none">
                              <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">{title}</p>
                              {rating > 0 && (
                                <div className="mt-1">
                                  <RatingDisplay value={rating} size="sm" />
                                </div>
                              )}
                              {media && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {media.genres.slice(0, 3).map((g) => (
                                    <span key={g} className="text-[9px] bg-gray-800 text-gray-400 px-1 py-0.5 rounded">{g}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CompactStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex-1 px-4 py-2.5 flex items-center gap-2 min-w-0">
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 whitespace-nowrap">{label}</p>
        <p className="text-sm font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}
