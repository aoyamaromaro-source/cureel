"use client";

import { useState, useEffect, useCallback } from "react";
import { QUOTA_EVENT, TOAST_EVENT, type ToastDetail, type ToastType } from "@/lib/storage";

interface ToastItem extends ToastDetail {
  id: number;
}

let nextId = 0;

const ICONS: Record<ToastType, string> = {
  error: "⚠️",
  warning: "💡",
  success: "✓",
};

const STYLES: Record<ToastType, string> = {
  error:   "bg-red-950/95 border-red-800/60 text-red-200",
  warning: "bg-yellow-950/95 border-yellow-800/60 text-yellow-200",
  success: "bg-emerald-950/95 border-emerald-800/60 text-emerald-200",
};

const TTL: Record<ToastType, number> = { error: 8000, warning: 5000, success: 3000 };

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), TTL[type]);
    },
    [dismiss]
  );

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, type } = (e as CustomEvent<ToastDetail>).detail;
      add(message, type);
    };
    const onQuota = () => {
      add(
        "ストレージ容量が不足しています。設定画面からデータをエクスポートして容量を確保してください。",
        "error"
      );
    };
    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener(QUOTA_EVENT, onQuota);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener(QUOTA_EVENT, onQuota);
    };
  }, [add]);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm pointer-events-auto ${STYLES[t.type]}`}
        >
          <span className="shrink-0 text-base">{ICONS[t.type]}</span>
          <p className="flex-1 leading-relaxed">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity leading-none"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
