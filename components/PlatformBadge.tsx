import type { AnilistExternalLink, Platform } from "@/types";
import { PLATFORM_INFO, getAvailablePlatforms, getWatchStatus } from "@/lib/platforms";

interface Props {
  links: AnilistExternalLink[];
  subscriptions: Platform[];
  /** localStorage から読み込んだ手動設定プラットフォーム */
  manualPlatforms?: Platform[] | null;
  compact?: boolean;
}

export function PlatformBadge({ links, subscriptions, manualPlatforms, compact }: Props) {
  // 手動設定がある場合はそれを優先、なければ AniList の外部リンクから検出
  const autoPlatforms = getAvailablePlatforms(links);
  const available: Platform[] = manualPlatforms
    ? Array.from(new Set([...manualPlatforms, ...autoPlatforms]))
    : autoPlatforms;

  const watchable = available.some((p) => subscriptions.includes(p));
  const hasAny = available.length > 0;

  if (!hasAny) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            watchable
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-gray-700 text-gray-400"
          }`}
        >
          {watchable ? "▶ 視聴可" : "🔒 要録画"}
        </span>
        {manualPlatforms && (
          <span className="text-[9px] text-indigo-400/70 font-medium">✎</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {manualPlatforms && (
        <p className="text-[9px] text-indigo-400/70 font-medium">✎ 手動設定</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {available.map((platform) => {
          const info = PLATFORM_INFO[platform];
          const isOwned = subscriptions.includes(platform);
          const isManual = manualPlatforms?.includes(platform);
          return (
            <span
              key={platform}
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                isOwned
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-gray-600 bg-gray-800 text-gray-400"
              } ${isManual && !isOwned ? "border-dashed" : ""}`}
              title={isOwned ? "サブスク済み" : isManual ? "手動設定" : "未契約"}
            >
              {info.label}
              {isOwned && <span className="ml-1">✓</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
