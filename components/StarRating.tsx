"use client";

import { useState, useEffect, useRef } from "react";

// value: 0 = 未評価、0.1〜5.0（0.1 刻み）
interface Props {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const STAR_SIZE = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" } as const;
const NUM_SIZE  = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" } as const;
const SLIDER_W  = { sm: "w-20", md: "w-24", lg: "w-32" } as const;
const INPUT_W   = { sm: "w-10", md: "w-11", lg: "w-12" } as const;

function FilledStar({ pct, sizeCls }: { pct: number; sizeCls: string }) {
  return (
    <span className={`relative inline-block leading-none select-none ${sizeCls}`}>
      <span className="text-gray-700" aria-hidden>★</span>
      <span
        className="absolute inset-0 text-yellow-400 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        aria-hidden
      >★</span>
    </span>
  );
}

export function RatingDisplay({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  if (value <= 0) {
    return <span className={`text-gray-600 ${NUM_SIZE[size]}`}>未評価</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <FilledStar pct={(value / 5) * 100} sizeCls={STAR_SIZE[size]} />
      <span className={`font-bold text-white tabular-nums ${NUM_SIZE[size]}`}>
        {value.toFixed(1)}
      </span>
    </span>
  );
}

function clampRating(v: number): number {
  return Math.round(Math.min(5.0, Math.max(0.1, v)) * 10) / 10;
}

export function StarRating({ value, onChange, readonly, size = "md" }: Props) {
  // Local text state for the number input (handles partial typing like "4.")
  const [inputText, setInputText] = useState<string>(() =>
    value > 0 ? value.toFixed(1) : ""
  );
  const prevValueRef = useRef(value);

  // Sync inputText when parent value changes externally (e.g. slider/stars)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setInputText(value > 0 ? value.toFixed(1) : "");
    }
  }, [value]);

  if (readonly) {
    return <RatingDisplay value={value} size={size} />;
  }

  const base = value > 0 ? Math.min(5, Math.max(1, Math.round(value))) : 0;
  const offsetRaw = value > 0 ? Math.round((value - base) * 10) / 10 : 0;
  const offsetInt = Math.round(offsetRaw * 10);

  const emit = (newVal: number) => {
    prevValueRef.current = newVal;
    onChange?.(newVal);
    setInputText(newVal > 0 ? newVal.toFixed(1) : "");
  };

  const emitFromBaseOffset = (newBase: number, newOffsetInt: number) => {
    if (newBase === 0) { emit(0); return; }
    emit(clampRating(newBase + newOffsetInt / 10));
  };

  const handleStarClick = (n: number) => {
    if (n === base && offsetInt === 0) {
      prevValueRef.current = 0;
      onChange?.(0);
      setInputText("");
    } else {
      emitFromBaseOffset(n, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 5.0) {
      prevValueRef.current = clampRating(parsed);
      onChange?.(clampRating(parsed));
    }
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 5.0) {
      const clamped = clampRating(parsed);
      emit(clamped);
    } else if (inputText === "" || inputText === "0") {
      emit(0);
    } else {
      // Reset to current value on invalid input
      setInputText(value > 0 ? value.toFixed(1) : "");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  };

  const sz = size;

  return (
    <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5">
      {/* 星ボタン */}
      <div className="flex gap-0.5" role="group" aria-label="評価（星）">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleStarClick(n)}
            className={`${STAR_SIZE[sz]} leading-none transition-transform hover:scale-110 active:scale-90 ${
              n <= base ? "text-yellow-400" : "text-gray-600"
            }`}
            title={`${n}点`}
            aria-pressed={n === base}
          >
            ★
          </button>
        ))}
      </div>

      {/* 微調整スライダー（ベース確定後のみ） */}
      {base > 0 && (
        <>
          <input
            type="range"
            min="-9"
            max="9"
            step="1"
            value={offsetInt}
            onChange={(e) => emitFromBaseOffset(base, parseInt(e.target.value, 10))}
            className={`${SLIDER_W[sz]} rating-slider cursor-pointer`}
            aria-label={`微調整: ${offsetInt >= 0 ? "+" : ""}${(offsetInt / 10).toFixed(1)}`}
          />

          {/* 数値直接入力 */}
          <input
            type="number"
            min="0.1"
            max="5.0"
            step="0.1"
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className={`${INPUT_W[sz]} bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg text-center text-white font-bold outline-none transition-colors tabular-nums ${NUM_SIZE[sz]} py-1 px-0`}
            aria-label="評価値を直接入力"
          />

          {/* クリアボタン */}
          <button
            type="button"
            onClick={() => { prevValueRef.current = 0; onChange?.(0); setInputText(""); }}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors leading-none"
            title="評価をクリア"
            aria-label="評価をクリア"
          >
            ✕
          </button>
        </>
      )}

      {/* 未評価時 */}
      {base === 0 && (
        <>
          <input
            type="number"
            min="0.1"
            max="5.0"
            step="0.1"
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="--"
            className={`${INPUT_W[sz]} bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg text-center text-white font-bold outline-none transition-colors tabular-nums ${NUM_SIZE[sz]} py-1 px-0 placeholder-gray-600`}
            aria-label="評価値を直接入力"
          />
          <span className={`text-gray-600 ${NUM_SIZE[sz]}`}>星をタップして評価</span>
        </>
      )}
    </div>
  );
}
