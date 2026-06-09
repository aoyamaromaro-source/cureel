"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import { SeasonToggle } from "@/components/SeasonToggle";
import { SearchFilter } from "@/components/SearchFilter";
import { SearchModal } from "@/components/SearchModal";
import { SeasonSelectModal } from "@/components/SeasonSelectModal";
import Image from "next/image";
import type { AnilistMedia, Platform, SeasonInfo } from "@/types";
import { getCurrentSeason } from "@/lib/seasons";
import { DEFAULT_SUBSCRIPTIONS } from "@/lib/platforms";
import { detectSequels } from "@/lib/recommend";
import { getWatchlist, isInWatchlist, addToWatchlist } from "@/lib/watchlist";
import { getWatchStatus } from "@/lib/platforms";

type Mode = "season" | "free";

const FORMAT_LABEL: Record<string, string> = {
  TV: "TV", TV_SHORT: "TVショート", MOVIE: "映画",
  OVA: "OVA", ONA: "ONA", SPECIAL: "特別篇", MUSIC: "ミュージック",
};
const SEASON_LABEL: Record<string, string> = {
  WINTER: "冬", SPRING: "春", SUMMER: "夏", FALL: "秋",
};

export default function SeasonalPage() {
  const [mode, setMode] = useState<Mode>("season");

  // ─── クール指定モード state ────────────────────────────────────
  const [season, setSeason] = useState<SeasonInfo>(getCurrentSeason);
  const [anime, setAnime] = useState<AnilistMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studioFilter, setStudioFilter] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // ─── フリー検索モード state ────────────────────────────────────
  const [freeQuery, setFreeQuery] = useState("");
  const [freeResults, setFreeResults] = useState<AnilistMedia[]>([]);
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeError, setFreeError] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<AnilistMedia | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const freeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 共通 ──────────────────────────────────────────────────────
  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set());
  const [subscriptions, setSubscriptions] = useState<Platform[]>(DEFAULT_SUBSCRIPTIONS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("anime-subscriptions");
      if (stored) setSubscriptions(JSON.parse(stored));
    } catch {}
    setWatchedIds(new Set(getWatchlist().map((e) => e.mediaId)));
  }, []);

  const refreshWatchedIds = () => {
    setWatchedIds(new Set(getWatchlist().map((e) => e.mediaId)));
  };

  // ─── クール指定モード: データ取得 ──────────────────────────────
  const fetchSeasonal = useCallback(async (info: SeasonInfo) => {
    setLoading(true);
    setError(null);
    setSearchQuery("");
    setFilterGenre(null);
    setStudioFilter("");
    try {
      const res = await fetch(`/api/seasonal?season=${info.season}&year=${info.year}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAnime(data.media);
    } catch {
      setError("データの取得に失敗しました。しばらくしてから再試行してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSeasonal(season); }, [season, fetchSeasonal]);

  // ─── フリー検索モード: デバウンス検索 ─────────────────────────
  const freeSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setFreeResults([]); setFreeError(false); return; }
    setFreeLoading(true);
    setFreeError(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFreeResults(data.media ?? []);
    } catch {
      setFreeError(true);
      setFreeResults([]);
    } finally {
      setFreeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (freeTimerRef.current) clearTimeout(freeTimerRef.current);
    freeTimerRef.current = setTimeout(() => freeSearch(freeQuery), 300);
    return () => { if (freeTimerRef.current) clearTimeout(freeTimerRef.current); };
  }, [freeQuery, freeSearch]);

  // ─── クール指定モード: フィルター ─────────────────────────────
  const sequelIds = detectSequels(anime, watchedIds);

  const allGenres = useMemo(
    () => Array.from(new Set(anime.flatMap((a) => a.genres))).sort(),
    [anime]
  );
  const allStudios = useMemo(
    () => Array.from(new Set(
      anime.flatMap((a) => a.studios.nodes.filter((s) => s.isAnimationStudio).map((s) => s.name))
    )).sort(),
    [anime]
  );

  const { sequelAnime, regularAnime } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = anime.filter((a) => {
      if (filterGenre && !a.genres.includes(filterGenre)) return false;
      if (studioFilter && !a.studios.nodes.some((s) => s.name === studioFilter)) return false;
      if (!q) return true;
      const titleMatch =
        a.title.romaji.toLowerCase().includes(q) ||
        (a.title.native ?? "").toLowerCase().includes(q) ||
        (a.title.english ?? "").toLowerCase().includes(q);
      const studioMatch = a.studios.nodes.some((s) => s.name.toLowerCase().includes(q));
      const vaMatch = a.characters?.edges.some((e) =>
        e.voiceActors.some((va) =>
          va.name.full.toLowerCase().includes(q) ||
          (va.name.native ?? "").toLowerCase().includes(q)
        )
      ) ?? false;
      const staffMatch = !vaMatch && (a.staff?.edges.some((e) =>
        e.node.name.full.toLowerCase().includes(q) ||
        (e.node.name.native ?? "").toLowerCase().includes(q)
      ) ?? false);
      return titleMatch || studioMatch || vaMatch || staffMatch;
    });
    return {
      sequelAnime: filtered.filter((a) => sequelIds.has(a.id)),
      regularAnime: filtered.filter((a) => !sequelIds.has(a.id)),
    };
  }, [anime, filterGenre, studioFilter, searchQuery, sequelIds]);

  const isFiltered = !!(filterGenre || studioFilter || searchQuery);
  const totalDisplayed = sequelAnime.length + regularAnime.length;

  const isAdded = (id: number) => isInWatchlist(id) || addedIds.has(id);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* ヘッダー */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">探す</h1>
            {mode === "season" && !loading && (
              <p className="text-sm text-gray-400 mt-0.5">
                {totalDisplayed} 作品（TVアニメ）
                {isFiltered && ` / ${anime.length} 件中`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* モード切り替え */}
            <div className="flex gap-0.5 p-0.5 bg-gray-800 border border-gray-700 rounded-lg">
              <button
                onClick={() => setMode("season")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === "season"
                    ? "bg-violet-700 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                クール指定
              </button>
              <button
                onClick={() => setMode("free")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === "free"
                    ? "bg-violet-700 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                フリー検索
              </button>
            </div>

            {mode === "season" && (
              <>
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <span className="text-base leading-none">🔍</span>
                  タイトルで追加
                </button>
                <SeasonToggle current={season} onChange={setSeason} />
              </>
            )}
          </div>
        </div>

        {/* ════════════════ クール指定モード ════════════════ */}
        {mode === "season" && (
          <>
            {!loading && (
              <SearchFilter
                query={searchQuery}
                onQueryChange={setSearchQuery}
                studio={studioFilter}
                onStudioChange={setStudioFilter}
                studios={allStudios}
              />
            )}

            {!loading && allGenres.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                <button
                  onClick={() => setFilterGenre(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    !filterGenre ? "bg-violet-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  すべて
                </button>
                {allGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setFilterGenre(g === filterGenre ? null : g)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      filterGenre === g ? "bg-violet-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            {isFiltered && !loading && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterGenre && <FilterChip label={`ジャンル: ${filterGenre}`} onRemove={() => setFilterGenre(null)} />}
                {studioFilter && <FilterChip label={`スタジオ: ${studioFilter}`} onRemove={() => setStudioFilter("")} />}
                {searchQuery && <FilterChip label={`検索: "${searchQuery}"`} onRemove={() => setSearchQuery("")} />}
                <button
                  onClick={() => { setFilterGenre(null); setStudioFilter(""); setSearchQuery(""); }}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  すべてクリア
                </button>
              </div>
            )}

            {error && (
              <div className="text-center py-12 text-red-400">
                <p>{error}</p>
                <button
                  onClick={() => fetchSeasonal(season)}
                  className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                >
                  再試行
                </button>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-gray-900 animate-pulse">
                    <div className="aspect-[2/3] bg-gray-800" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && sequelAnime.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl w-fit">
                  <span className="text-yellow-400 text-sm font-semibold">★ 続きを見る</span>
                  <span className="text-yellow-400/60 text-xs">— 視聴済み続編 {sequelAnime.length}作品</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {sequelAnime.map((media) => (
                    <AnimeCard key={media.id} media={media} subscriptions={subscriptions} isSequel onWatchlistChange={refreshWatchedIds} />
                  ))}
                </div>
              </section>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {regularAnime.map((media) => (
                  <AnimeCard key={media.id} media={media} subscriptions={subscriptions} onWatchlistChange={refreshWatchedIds} />
                ))}
                {!totalDisplayed && (
                  <div className="col-span-full text-center py-16 text-gray-500">
                    <p className="text-3xl mb-3">🔍</p>
                    <p className="font-medium">条件に一致する作品が見つかりません</p>
                    <button
                      onClick={() => { setFilterGenre(null); setStudioFilter(""); setSearchQuery(""); }}
                      className="mt-3 text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2"
                    >
                      フィルターをリセット
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════════════ フリー検索モード ════════════════ */}
        {mode === "free" && (
          <div className="space-y-4">
            {/* 検索入力 */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">
                🔍
              </span>
              <input
                type="text"
                value={freeQuery}
                onChange={(e) => setFreeQuery(e.target.value)}
                placeholder="タイトル・声優・スタジオ・原作名..."
                autoFocus
                className="w-full pl-9 pr-10 py-2.5 bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
              />
              {freeQuery && (
                <button
                  onClick={() => { setFreeQuery(""); setFreeResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm transition-colors"
                  aria-label="クリア"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 初期状態 */}
            {!freeQuery && (
              <div className="py-16 text-center space-y-2">
                <p className="text-3xl">🔍</p>
                <p className="text-sm text-gray-400">タイトルを入力して検索</p>
                <p className="text-xs text-gray-600">TV・映画・OVA・ONA など幅広く検索できます</p>
              </div>
            )}

            {/* ローディング */}
            {freeLoading && (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse p-3">
                    <div className="w-10 h-14 bg-gray-800 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3.5 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                      <div className="h-3 bg-gray-800 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* エラー */}
            {freeError && !freeLoading && (
              <p className="py-10 text-center text-sm text-red-400">
                検索に失敗しました。しばらくしてから再試行してください。
              </p>
            )}

            {/* 結果なし */}
            {!freeLoading && !freeError && freeQuery && freeResults.length === 0 && (
              <div className="py-16 text-center space-y-1">
                <p className="text-3xl">😕</p>
                <p className="text-sm text-gray-400">「{freeQuery}」に一致する作品が見つかりません</p>
              </div>
            )}

            {/* 結果リスト */}
            {!freeLoading && freeResults.length > 0 && (
              <div className="space-y-0.5 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {freeResults.map((media) => {
                  const title = media.title.native ?? media.title.romaji;
                  const added = isAdded(media.id);
                  const animStudios = media.studios.nodes.filter((s) => s.isAnimationStudio);
                  const watchStatus = getWatchStatus(media.externalLinks, subscriptions);

                  return (
                    <div
                      key={media.id}
                      className="flex gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors border-b border-gray-800/60 last:border-0"
                    >
                      {/* Cover */}
                      <div
                        className="relative w-10 shrink-0 rounded-lg overflow-hidden bg-gray-800 shadow"
                        style={{ aspectRatio: "2/3" }}
                      >
                        <Image src={media.coverImage.medium} alt={title} fill className="object-cover" sizes="40px" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-white leading-tight line-clamp-1">{title}</p>
                        {media.title.romaji !== title && (
                          <p className="text-[11px] text-gray-500 line-clamp-1">{media.title.romaji}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          {media.format && (
                            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                              {FORMAT_LABEL[media.format] ?? media.format}
                            </span>
                          )}
                          {media.seasonYear && media.season && (
                            <span className="text-[10px] text-gray-500">
                              {media.seasonYear}年{SEASON_LABEL[media.season] ?? media.season}
                            </span>
                          )}
                          {animStudios[0] && (
                            <span className="text-[10px] text-gray-500">{animStudios[0].name}</span>
                          )}
                          {watchStatus === "watchable" && (
                            <span className="text-[10px] text-emerald-400 font-medium">▶ 視聴可</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {media.genres.slice(0, 3).map((g) => (
                            <span key={g} className="text-[10px] bg-gray-800/80 text-gray-500 px-1 py-0.5 rounded">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 追加ボタン */}
                      <button
                        onClick={() => {
                          if (!added) setPendingMedia(media);
                        }}
                        disabled={added}
                        className={`shrink-0 self-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-w-[72px] ${
                          added
                            ? "bg-violet-600/20 text-violet-400 cursor-default"
                            : "bg-violet-700 hover:bg-violet-600 active:bg-violet-800 text-white"
                        }`}
                      >
                        {added ? "✓ 追加済み" : "+ 追加"}
                      </button>
                    </div>
                  );
                })}

                <div className="px-4 py-2 text-xs text-gray-600 text-center border-t border-gray-800">
                  {freeResults.length} 件表示 · Powered by AniList
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* タイトル検索モーダル（クール指定モード用） */}
      {showSearch && (
        <SearchModal
          subscriptions={subscriptions}
          onClose={() => setShowSearch(false)}
          onAdded={refreshWatchedIds}
        />
      )}

      {/* クール選択モーダル（フリー検索モード用） */}
      {pendingMedia && (
        <SeasonSelectModal
          media={pendingMedia}
          onClose={() => setPendingMedia(null)}
          onConfirm={(seasonKey) => {
            addToWatchlist(pendingMedia, seasonKey);
            setAddedIds((prev) => new Set([...prev, pendingMedia.id]));
            refreshWatchedIds();
            setPendingMedia(null);
          }}
        />
      )}
    </>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300">
      {label}
      <button onClick={onRemove} className="text-gray-500 hover:text-white transition-colors leading-none">
        ✕
      </button>
    </span>
  );
}
