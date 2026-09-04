export type DataMode = "demo" | "manual";

export const DATA_MODE_KEY = "tradovia.production.data-mode.v1";

export function getDataMode(): DataMode {
  if (typeof window === "undefined") return "demo";
  const saved = window.localStorage.getItem(DATA_MODE_KEY);
  if (saved === "demo" || saved === "manual") return saved;
  const hasUserData = Boolean(
    window.localStorage.getItem("tradovia.production.trades.v1") ||
    window.localStorage.getItem("tradoviaTrades"),
  );
  return hasUserData ? "manual" : "demo";
}

export function setDataMode(mode: DataMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DATA_MODE_KEY, mode);
}
