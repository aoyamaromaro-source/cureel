"use client";

import { useState, useEffect, useRef } from "react";
import { SubscriptionSettings } from "@/components/SubscriptionSettings";
import type { Platform } from "@/types";
import { DEFAULT_SUBSCRIPTIONS } from "@/lib/platforms";
import { safeGet, safeSet, showToast } from "@/lib/storage";

const MAX_STORAGE_BYTES = 5 * 1024 * 1024; // 5 MB typical limit

function getLocalStorageBytes(): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "";
      const val = localStorage.getItem(key) ?? "";
      total += (key.length + val.length) * 2; // UTF-16: 2 bytes per char
    }
  } catch {}
  return total;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

const DATA_KEYS = [
  "cureel-watchlist",
  "anime-watchlist",  // legacy key
  "anime-ratings",
  "anime-manual-platforms",
  "anime-subscriptions",
];

function exportData(): string {
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString() };
  for (const key of DATA_KEYS) {
    try {
      const v = localStorage.getItem(key);
      if (v) data[key] = JSON.parse(v);
    } catch {}
  }
  return JSON.stringify(data, null, 2);
}

function importData(raw: string): { ok: boolean; message: string } {
  try {
    const data = JSON.parse(raw);
    for (const key of DATA_KEYS) {
      if (data[key] !== undefined) {
        safeSet(key, data[key]);
      }
    }
    return { ok: true, message: "インポートが完了しました。ページをリロードしてください。" };
  } catch {
    return { ok: false, message: "JSONの読み込みに失敗しました。" };
  }
}

export default function SettingsPage() {
  const [subscriptions, setSubscriptions] = useState<Platform[]>(DEFAULT_SUBSCRIPTIONS);
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [storageBytes, setStorageBytes] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStorageBytes(getLocalStorageBytes());
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("anime-subscriptions");
      if (stored) setSubscriptions(JSON.parse(stored));
    } catch {}
  }, []);

  const handleChange = (platforms: Platform[]) => {
    setSubscriptions(platforms);
    localStorage.setItem("anime-subscriptions", JSON.stringify(platforms));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cureel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      const result = importData(raw);
      setImportMsg({ ok: result.ok, text: result.message });
      showToast(result.message, result.ok ? "success" : "error");
      if (e.target) e.target.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">設定</h1>
        <p className="text-sm text-gray-400 mt-0.5">視聴環境とデータを管理します</p>
      </div>

      {/* Subscriptions */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">契約サブスクリプション</h2>
          {saved && <span className="text-xs text-emerald-400 font-medium">✓ 保存しました</span>}
        </div>
        <SubscriptionSettings selected={subscriptions} onChange={handleChange} />
        <p className="text-xs text-gray-500">
          選択したサービスと照合して「視聴可」「要録画」を各アニメに表示します。
        </p>
      </section>

      {/* Export / Import */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">データ管理</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors text-left"
          >
            <span className="text-2xl">📤</span>
            <div>
              <p className="text-sm font-semibold text-white">エクスポート</p>
              <p className="text-xs text-gray-400 mt-0.5">視聴リスト・評価をJSONで保存</p>
            </div>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors text-left"
          >
            <span className="text-2xl">📥</span>
            <div>
              <p className="text-sm font-semibold text-white">インポート</p>
              <p className="text-xs text-gray-400 mt-0.5">バックアップJSONから復元</p>
            </div>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {importMsg && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
            importMsg.ok
              ? "bg-emerald-900/30 border border-emerald-800/50 text-emerald-300"
              : "bg-red-900/30 border border-red-800/50 text-red-300"
          }`}>
            <span>{importMsg.ok ? "✓" : "⚠"}</span>
            <span>{importMsg.text}</span>
          </div>
        )}
      </section>

      {/* localStorage usage */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-white">ストレージ使用量</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">使用中</span>
            <span className="font-medium text-white">
              {formatBytes(storageBytes)} / {formatBytes(MAX_STORAGE_BYTES)}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                storageBytes / MAX_STORAGE_BYTES > 0.8
                  ? "bg-red-500"
                  : storageBytes / MAX_STORAGE_BYTES > 0.5
                  ? "bg-amber-500"
                  : "bg-violet-500"
              }`}
              style={{ width: `${Math.min(100, (storageBytes / MAX_STORAGE_BYTES) * 100).toFixed(1)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            視聴リストはmediaIdとタイトルのみ保存し、カバー画像・ジャンル等はAniListから都度取得します
          </p>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-gray-900 border border-red-900/30 rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-semibold text-red-400">データ削除（注意）</h2>
        <p className="text-sm text-gray-400">
          すべての視聴リスト・評価・設定データを削除します。この操作は取り消せません。
        </p>
        <button
          onClick={() => {
            if (confirm("すべてのデータを削除しますか？この操作は取り消せません。")) {
              for (const key of [...DATA_KEYS, "anime-subscriptions"]) {
                localStorage.removeItem(key);
              }
              window.location.reload();
            }
          }}
          className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 text-sm font-medium rounded-xl transition-colors"
        >
          すべてのデータを削除
        </button>
      </section>
    </div>
  );
}
