"use client";

import { useState } from "react";
import Image from "next/image";
import type { AnilistMedia } from "@/types";
import { getCurrentSeason, getNextSeason, getPrevSeason } from "@/lib/seasons";
import { seasonKeyLabel } from "@/lib/watchlist";

interface Props {
  media: AnilistMedia;
  /** 現在のクールキー（編集時にプリセット） */
  initialSeasonKey?: string;
  /** 確定ボタンのラベル。デフォルト "追加" */
  confirmLabel?: string;
  onClose: () => void;
  /** 選択されたクールキーを返す。"UNKNOWN" の場合もある */
  onConfirm: (seasonKey: string) => void;
}

/** ±4 クール分のキーリストを生成（新しい順）。extraKey が範囲外なら末尾に追加 */
function buildSeasonOptions(extraKey?: string): string[] {
  const seasons: string[] = [];
  let start = getCurrentSeason();
  for (let i = 0; i < 4; i++) start = getPrevSeason(start);
  let s = start;
  for (let i = 0; i < 9; i++) {
    seasons.push(`${s.year}-${s.season}`);
    s = getNextSeason(s);
  }
  seasons.reverse(); // 新しい順
  if (extraKey && extraKey !== "UNKNOWN" && !seasons.includes(extraKey)) {
    seasons.push(extraKey);
  }
  return seasons;
}

function mediaSeasonKey(media: AnilistMedia): string | undefined {
  return media.season && media.seasonYear
    ? `${media.seasonYear}-${media.season}`
    : undefined;
}

export function SeasonSelectModal({
  media,
  initialSeasonKey,
  confirmLabel = "追加",
  onClose,
  onConfirm,
}: Props) {
  const seasonOptions = buildSeasonOptions(initialSeasonKey);
  const allOptions = [...seasonOptions, "UNKNOWN"];

  const cur = getCurrentSeason();
  const currentKey = `${cur.year}-${cur.season}`;
  const broadcastKey = mediaSeasonKey(media);

  const defaultKey = (() => {
    if (initialSeasonKey !== undefined && allOptions.includes(initialSeasonKey)) {
      return initialSeasonKey;
    }
    if (broadcastKey && allOptions.includes(broadcastKey)) return broadcastKey;
    return "UNKNOWN";
  })();

  const [selected, setSelected] = useState<string>(defaultKey);
  const title = media.title.native ?? media.title.romaji;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {media.coverImage.medium ? (
                <div
                  className="relative shrink-0 rounded-lg overflow-hidden"
                  style={{ width: 40, aspectRatio: "2/3" }}
                >
                  <Image
                    src={media.coverImage.medium}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div
                  className="shrink-0 rounded-lg bg-gray-700"
                  style={{ width: 40, aspectRatio: "2/3" }}
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white line-clamp-2">{title}</p>
                {media.title.romaji !== title && (
                  <p className="text-[11px] text-gray-500 line-clamp-1">{media.title.romaji}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-sm"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-400">クールを選んでください</p>
        </div>

        {/* Options */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-none pr-0.5">
            {allOptions.map((key) => {
              const isUnknown = key === "UNKNOWN";
              const isCurrent = key === currentKey;
              const isBroadcast = broadcastKey && key === broadcastKey && key !== currentKey;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    selected === key
                      ? "bg-violet-700/30 border-violet-500/60 text-violet-300"
                      : isUnknown
                      ? "bg-gray-800/30 border-gray-700/30 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                      : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span className="flex-1">{seasonKeyLabel(key)}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-gray-500 shrink-0">現クール</span>
                  )}
                  {isBroadcast && (
                    <span className="text-[10px] text-violet-400/70 shrink-0">放映クール</span>
                  )}
                  {selected === key && (
                    <span className="text-violet-400 text-base leading-none shrink-0">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={() => onConfirm(selected)}
              className="flex-1 px-4 py-2.5 bg-violet-700 hover:bg-violet-600 active:bg-violet-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
