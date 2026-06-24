"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { AnilistMedia, Platform } from "@/types";
import { PlatformBadge } from "./PlatformBadge";
import { PlatformEditor } from "./PlatformEditor";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";
import { getManualPlatforms } from "@/lib/manualPlatforms";

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

interface Props {
  media: AnilistMedia;
  subscriptions: Platform[];
  isSequel?: boolean;
  onWatchlistChange?: () => void;
}

function formatAiringDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").slice(0, 120) + "…";
}

export function AnimeCard({ media, subscriptions, isSequel, onWatchlistChange }: Props) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [manualPlatforms, setManualPlatforms] = useState<Platform[] | null>(null);

  useEffect(() => {
    setInWatchlist(isInWatchlist(media.id));
    setManualPlatforms(getManualPlatforms(media.id));
  }, [media.id]);

  const handleEditorClose = () => {
    setShowEditor(false);
    setManualPlatforms(getManualPlatforms(media.id));
  };

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(media.id);
      setInWatchlist(false);
    } else {
      addToWatchlist(media);
      setInWatchlist(true);
    }
    onWatchlistChange?.();
  };

  const voiceActors = Array.from(
    new Map(
      (media.characters?.edges ?? [])
        .flatMap((e) => e.voiceActors)
        .map((va) => [va.id, va])
    ).values()
  ).slice(0, 6);

  const title = media.title.native ?? media.title.romaji;
  const coverColor = media.coverImage.color ?? "#1e293b";

  return (
    <>
      <div
        className={`group relative bg-gray-900 rounded-xl overflow-hidden border transition-all cursor-pointer ${
          isSequel
            ? "border-yellow-500/60 shadow-yellow-500/10 shadow-lg"
            : inWatchlist
            ? "border-violet-500 shadow-violet-500/20 shadow-md"
            : "border-gray-800 hover:border-gray-700"
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        {isSequel && (
          <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-gray-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
            続編
          </div>
        )}

        {/* Watchlist checkbox */}
        <button
          onClick={toggleWatchlist}
          className={`absolute top-2 right-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all border-2 ${
            inWatchlist
              ? "bg-violet-600 border-violet-600 text-white"
              : "bg-gray-900/80 border-gray-400 text-transparent hover:border-gray-200"
          }`}
          title={inWatchlist ? "リストから削除" : "視聴リストに追加"}
        >
          {inWatchlist && (
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7l3.5 3.5L12 3" />
            </svg>
          )}
        </button>

        {/* Cover */}
        <div
          className="relative aspect-[2/3] w-full overflow-hidden"
          style={{ background: coverColor + "40" }}
        >
          <Image
            src={media.coverImage.large}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
              {title}
            </h3>
            {media.title.romaji && media.title.romaji !== title && (
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                {media.title.romaji}
              </p>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1">
            {media.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>

          {/* Platform compact */}
          <PlatformBadge
            links={media.externalLinks}
            subscriptions={subscriptions}
            manualPlatforms={manualPlatforms}
            compact
          />

          {/* Next airing */}
          {media.nextAiringEpisode && (
            <p className="text-[11px] text-gray-500">
              第{media.nextAiringEpisode.episode}話:{" "}
              {formatAiringDate(media.nextAiringEpisode.airingAt)}
            </p>
          )}

          {/* Expanded details */}
          {expanded && (
            <div className="pt-2 border-t border-gray-800 space-y-2.5">
              {media.description && (
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {stripHtml(media.description)}
                </p>
              )}

              {/* Studios */}
              {media.studios.nodes.filter((s) => s.isAnimationStudio).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {media.studios.nodes
                    .filter((s) => s.isAnimationStudio)
                    .map((s, idx) => (
                      <span key={`studio-${s.id}-${idx}`} className="text-[10px] bg-violet-900/40 text-violet-400 px-1.5 py-0.5 rounded">
                        {s.name}
                      </span>
                    ))}
                </div>
              )}

              {/* Voice actors */}
              {voiceActors.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mb-1">声優</p>
                  <div className="flex flex-wrap gap-1">
                    {voiceActors.map((va) => (
                      <span key={va.id} className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                        {va.name.native ?? va.name.full}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform full + edit */}
              <div className="space-y-1.5">
                <PlatformBadge
                  links={media.externalLinks}
                  subscriptions={subscriptions}
                  manualPlatforms={manualPlatforms}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowEditor(true); }}
                  className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
                >
                  配信サービスを手動で編集
                </button>
              </div>

              {/* Official site + YouTube */}
              {(() => {
                const officialSite = media.externalLinks.find((l) => l.site === "Official Site");
                const youtube = media.externalLinks.find((l) => l.site === "YouTube");
                const ytId = youtube ? getYoutubeId(youtube.url) : null;
                if (!officialSite && !ytId) return null;
                return (
                  <div className="space-y-2">
                    {officialSite && (
                      <a
                        href={officialSite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded transition-colors"
                      >
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 10L10 2M10 2H5M10 2v5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        公式サイト
                      </a>
                    )}
                    {ytId && (
                      <a
                        href={youtube!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="relative block rounded overflow-hidden group/yt"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                          alt="予告動画"
                          className="w-full rounded"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover/yt:bg-black/55 transition-colors rounded">
                          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M5 3.5l9 4.5-9 4.5V3.5z"/>
                            </svg>
                          </div>
                          <span className="text-[10px] text-white/90 mt-1.5 font-medium">予告動画を見る</span>
                        </div>
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* Score/popularity + AniList link */}
              <div className="flex items-center justify-between gap-2">
                {media.averageScore ? (
                  <p className="text-[11px] text-gray-500">
                    スコア {media.averageScore}/100 · 人気 #{media.popularity.toLocaleString()}
                  </p>
                ) : <span />}
                {media.siteUrl && (
                  <a
                    href={media.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors shrink-0"
                  >
                    作品詳細
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 10L10 2M10 2H5M10 2v5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <PlatformEditor
          mediaId={media.id}
          mediaTitle={title}
          onClose={handleEditorClose}
        />
      )}
    </>
  );
}
