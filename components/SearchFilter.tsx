"use client";

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  studio: string;
  onStudioChange: (v: string) => void;
  studios: string[];
}

export function SearchFilter({ query, onQueryChange, studio, onStudioChange, studios }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Text search */}
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="タイトル・声優・制作会社を検索"
          className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Studio dropdown */}
      <div className="relative sm:w-52">
        <select
          value={studio}
          onChange={(e) => onStudioChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-8 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 focus:border-indigo-500 rounded-xl text-sm text-white outline-none transition-colors cursor-pointer"
        >
          <option value="">🏢 すべてのスタジオ</option>
          {studios.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">
          ▼
        </span>
      </div>
    </div>
  );
}
