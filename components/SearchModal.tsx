"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { AnilistMedia, Platform } from "@/types";
import { addToWatchlist, isInWatchlist } from "@/lib/watchlist";
import { getWatchStatus, DEFAULT_SUBSCRIPTIONS } from "@/lib/platforms";
import { getManualPlatforms } from "@/lib/manualPlatforms";

interface Props {
  subscriptions?: Platform[];
  onClose: () => void;
  onAdded?: (media: AnilistMedia) => void;
}

const FORMAT_LABEL: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TVショート",
  MOVIE: "映画",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "特別篇",
  MUSIC: "ミュージック",
};

const SEASON_LABEL: Record<string, string> = {
  WINTER: "冬", SPRING: "春", SUMMER: "夏", FALL: "秋",
};

export function SearchModal({ subscriptions = DEFAULT_SUBSCRIPTIONS, onClose, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnilistMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(() => {
    // 初期化: 既存の視聴リストIDをセット
    try {
      return new Set<number>();
    } catch { return new Set(); }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // モーダル開時にフォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ESC で閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setError(false); return; }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.media ?? []);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // デバウンス検索（300ms）
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  const handleAdd = (media: AnilistMedia) => {
    addToWatchlist(media);
    setAddedIds((prev) => new Set([...prev, media.id]));
    onAdded?.(media);
  };

  const isAdded = (id: number) => isInWatchlist(id) || addedIds.has(id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-14 bg-black/75 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: "calc(100vh - 7rem)" }}
      >
        {/* ヘッダー */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">アニメを検索して追加</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-sm"
              aria-label="閉じる"
            >✕</button>
          </div>

          {/* 検索入力 */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              🔍
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・原作名・ローマ字で検索..."
              className="w-full pl-9 pr-10 py-2.5 bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm transition-colors"
                aria-label="クリア"
              >✕</button>
            )}
          </div>
        </div>

        {/* 結果エリア */}
        <div className="flex-1 overflow-y-auto">
          {/* 初期状態 */}
          {!query && (
            <div className="py-12 text-center space-y-2">
              <p className="text-3xl">🔍</p>
              <p className="text-sm text-gray-400">タイトルを入力して検索</p>
              <p className="text-xs text-gray-600">TV・映画・OVA・ONA など幅広く検索できます</p>
            </div>
          )}

          {/* ローディング */}
          {loading && (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
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
          {error && !loading && (
            <p className="py-10 text-center text-sm text-red-400">
              検索に失敗しました。しばらくしてから再試行してください。
            </p>
          )}

          {/* 結果なし */}
          {!loading && !error && query && results.length === 0 && (
            <div className="py-12 text-center space-y-1">
              <p className="text-3xl">😕</p>
              <p className="text-sm text-gray-400">「{query}」に一致する作品が見つかりません</p>
            </div>
          )}

          {/* 結果リスト */}
          {!loading && results.length > 0 && (
            <div className="divide-y divide-gray-800/60">
              {results.map((media) => {
                const title = media.title.native ?? media.title.romaji;
                const added = isAdded(media.id);
                const animStudios = media.studios.nodes.filter((s) => s.isAnimationStudio);
                const watchStatus = getWatchStatus(
                  media.externalLinks,
                  subscriptions
                );

                return (
                  <div
                    key={media.id}
                    className="flex gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors"
                  >
                    {/* カバー画像 */}
                    <div
                      className="relative w-10 shrink-0 rounded-lg overflow-hidden bg-gray-800 shadow"
                      style={{ aspectRatio: "2/3" }}
                    >
                      <Image
                        src={media.coverImage.medium}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>

                    {/* 情報 */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
                        {title}
                      </p>
                      {media.title.romaji !== title && (
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {media.title.romaji}
                        </p>
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

                      {/* ジャンル */}
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
                      onClick={() => !added && handleAdd(media)}
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
            </div>
          )}
        </div>

        {/* フッター */}
        {results.length > 0 && !loading && (
          <div className="px-4 py-2.5 border-t border-gray-800 text-xs text-gray-600 text-center">
            {results.length} 件表示 · Powered by AniList
          </div>
        )}
      </div>
    </div>
  );
}
