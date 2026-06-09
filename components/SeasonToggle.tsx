"use client";

import type { SeasonInfo } from "@/types";
import { getPrevSeason, getNextSeason } from "@/lib/seasons";

interface Props {
  current: SeasonInfo;
  onChange: (info: SeasonInfo) => void;
}

export function SeasonToggle({ current, onChange }: Props) {
  const prev = getPrevSeason(current);
  const next = getNextSeason(current);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(prev)}
        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        ← {prev.label}
      </button>
      <span className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg">
        {current.label}
      </span>
      <button
        onClick={() => onChange(next)}
        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        {next.label} →
      </button>
    </div>
  );
}
