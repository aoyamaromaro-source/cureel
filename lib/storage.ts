export const QUOTA_EVENT = "cureel:quota-exceeded";
export const TOAST_EVENT = "cureel:toast";

export type ToastType = "error" | "warning" | "success";
export interface ToastDetail { message: string; type: ToastType; }

/** localStorage から JSON をパース。失敗時は fallback を返す。 */
export function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // 破損データ → fallback
    return fallback;
  }
}

/** localStorage に JSON を書き込む。QuotaExceededError を検知してイベントを発火。 */
export function safeSet(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      window.dispatchEvent(new CustomEvent(QUOTA_EVENT, { detail: { key } }));
    }
    return false;
  }
}

/** どこからでも呼べるトースト表示ヘルパー */
export function showToast(message: string, type: ToastType = "warning"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, type } })
  );
}
