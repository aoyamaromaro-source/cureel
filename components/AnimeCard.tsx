"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { AnilistMedia, Platform } from "@/types";
import { PlatformBadge } from "./PlatformBadge";
import { PlatformEditor } from "./PlatformEditor";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";
import { getManualPlatforms } from "@/lib/manualPlatforms";

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
            : "border-gray-800 hover:border-gray-700"
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        {isSequel && (
          <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-gray-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
            続編
          </div>
        )}

        {/* Watchlist button */}
        <button
          onClick={toggleWatchlist}
          className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${
            inWatchlist
              ? "bg-violet-600 text-white"
              : "bg-gray-900/80 text-gray-400 opacity-0 group-hover:opacity-100"
          }`}
          title={inWatchlist ? "リストから削除" : "視聴リストに追加"}
        >
          {inWatchlist ? "✓" : "+"}
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
                    AniList
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
