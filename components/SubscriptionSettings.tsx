"use client";

import { PLATFORM_INFO } from "@/lib/platforms";
import type { Platform } from "@/types";

interface Props {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

export function SubscriptionSettings({ selected, onChange }: Props) {
  const toggle = (platform: Platform) => {
    if (selected.includes(platform)) {
      onChange(selected.filter((p) => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(PLATFORM_INFO) as [Platform, (typeof PLATFORM_INFO)[Platform]][]).map(
        ([key, info]) => {
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                isSelected
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
              }`}
            >
              {info.label}
            </button>
          );
        }
      )}
    </div>
  );
}
