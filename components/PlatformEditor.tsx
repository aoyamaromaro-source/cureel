"use client";

import { useState, useEffect } from "react";
import type { Platform } from "@/types";
import { PLATFORM_INFO } from "@/lib/platforms";
import { getManualPlatforms, setManualPlatforms, clearManualPlatforms } from "@/lib/manualPlatforms";

interface Props {
  mediaId: number;
  mediaTitle: string;
  onClose: () => void;
}

const ALL_PLATFORMS = Object.keys(PLATFORM_INFO) as Platform[];

export function PlatformEditor({ mediaId, mediaTitle, onClose }: Props) {
  const [selected, setSelected] = useState<Platform[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const manual = getManualPlatforms(mediaId);
    if (manual) setSelected(manual);
  }, [mediaId]);

  const toggle = (p: Platform) => {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSave = () => {
    setManualPlatforms(mediaId, selected);
    setSaved(true);
    setTimeout(onClose, 600);
  };

  const handleClear = () => {
    clearManualPlatforms(mediaId);
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">配信サービスを手動設定</p>
            <p className="text-sm font-semibold text-white line-clamp-1 mt-0.5">{mediaTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Platform grid */}
        <div className="p-4 grid grid-cols-2 gap-2">
          {ALL_PLATFORMS.map((platform) => {
            const info = PLATFORM_INFO[platform];
            const isOn = selected.includes(platform);
            return (
              <button
                key={platform}
                onClick={() => toggle(platform)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isOn
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: isOn ? "#fff" : info.color }}
                />
                {info.label}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleClear}
            className="px-3 py-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            リセット
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {saved ? "✓ 保存しました" : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
