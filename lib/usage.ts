export const FREE_DAILY_LIMIT = 5;

export function getUserKey() {
  if (typeof window === "undefined") return "anonymous";
  let key = window.localStorage.getItem("jobforge-user-key");
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem("jobforge-user-key", key);
  }
  return key;
}

export function getTodayKey() {
  const today = new Date().toISOString().slice(0, 10);
  return `jobforge-usage-${today}`;
}

export function getLocalUsageCount() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(getTodayKey()) || "0");
}

export function incrementLocalUsageCount() {
  if (typeof window === "undefined") return 0;
  const current = getLocalUsageCount();
  const next = current + 1;
  window.localStorage.setItem(getTodayKey(), String(next));
  return next;
}
