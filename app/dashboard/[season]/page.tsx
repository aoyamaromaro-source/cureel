"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import html2canvas from "html2canvas-pro";
import { getWatchlist, getEntrySeasonKey } from "@/lib/watchlist";
import { getAllRatings } from "@/lib/ratings";
import { getCachedMediaBatch, setCachedMediaBatch } from "@/lib/mediaCache";
import { RatingDisplay } from "@/components/StarRating";
import { SEASON_META, parseSeasonKey } from "@/lib/seasonMeta";
import { showToast } from "@/lib/storage";
import type { AnilistMedia, StoredEntry } from "@/types";

function SummaryStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex-1 px-3 py-2.5 flex items-center gap-2 justify-center min-w-0">
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 whitespace-nowrap">{label}</p>
        <p className="text-sm font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export default function SeasonSummaryPage() {
  const params = useParams<{ season: string }>();
  const seasonKey = params.season;
  const parsed = parseSeasonKey(seasonKey);

  const [entries, setEntries] = useState<StoredEntry[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<number, AnilistMedia>>(new Map());
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loadedIds, setLoadedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getWatchlist().filter((e) => getEntrySeasonKey(e) === seasonKey);
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
  }, [seasonKey]);

  const stats = useMemo(() => {
    let sum = 0, count = 0;
    for (const e of entries) {
      const r = ratings[e.mediaId];
      if (r) { sum += r; count++; }
    }
    return { total: entries.length, avg: count ? (sum / count).toFixed(1) : null };
  }, [entries, ratings]);

  const mediaReady = entries.every((e) => mediaMap.has(e.mediaId));
  const imagesReady = entries.every((e) => !mediaMap.has(e.mediaId) || loadedIds.has(e.mediaId));
  const ready = mediaReady && imagesReady;

  const handleSave = async () => {
    if (!captureRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#030712",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `cureel-${seasonKey}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("画像を保存しました", "success");
    } catch {
      showToast("画像の保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!parsed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-4xl">📭</p>
        <p className="text-lg font-medium text-gray-300">無効なクールです</p>
        <Link href="/dashboard" className="inline-block mt-2 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors">
          年間ダッシュボードに戻る
        </Link>
      </div>
    );
  }

  const meta = SEASON_META[parsed.season];
  const seasonTitle = `${parsed.year}年 ${meta.label}アニメ`;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      <Link href="/dashboard" className="inline-block text-sm text-gray-400 hover:text-white transition-colors">
        ← 年間ダッシュボード
      </Link>

      {entries.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">📭</p>
          <p className="text-lg font-medium text-gray-300">このクールの登録作品はありません</p>
        </div>
      ) : (
        <>
          {/* Shareable card */}
          <div
            ref={captureRef}
            className={`rounded-2xl border ${meta.border} bg-gray-950 bg-gradient-to-b ${meta.color} p-5 space-y-4`}
          >
            <div className="text-center space-y-1.5">
              <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>
                {meta.label}クール
              </span>
              <h1 className="text-2xl font-black text-white">{seasonTitle}</h1>
            </div>

            <div className="flex divide-x divide-white/10 bg-black/25 border border-white/10 rounded-xl overflow-hidden">
              <SummaryStat icon="📺" label="視聴本数" value={`${stats.total}本`} />
              <SummaryStat icon="⭐" label="平均評価" value={stats.avg ?? "—"} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {entries.map((entry) => {
                const media = mediaMap.get(entry.mediaId);
                const title = media?.title.native ?? media?.title.romaji ?? entry.title.native ?? entry.title.romaji;
                const rating = ratings[entry.mediaId] ?? 0;
                return (
                  <div
                    key={entry.mediaId}
                    className="relative rounded-lg overflow-hidden bg-gray-800 border border-white/10"
                    style={{ aspectRatio: "2/3" }}
                  >
                    {media ? (
                      <Image
                        src={media.coverImage.large}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="150px"
                        onLoad={() => setLoadedIds((prev) => new Set(prev).add(entry.mediaId))}
                      />
                    ) : (
                      <div className="w-full h-full animate-pulse bg-gray-700" />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-5 pb-1 flex items-center justify-center">
                      <RatingDisplay value={rating} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-gray-500 tracking-wide">Cureel — アニメ視聴計画</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !ready}
            className="w-full py-3 bg-violet-700 hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? "画像を生成中…" : ready ? "画像として保存" : "読み込み中…"}
          </button>
        </>
      )}
    </div>
  );
}
