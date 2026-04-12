export type MoveDirection = "up" | "down" | "both";

export interface StockMoveAlertConfig {
  enabled: boolean;
  thresholdPct: number;
  direction: MoveDirection;
  cooldownMinutes: number;
}

const STORAGE_KEY = "stock_move_alerts_v1";

const DEFAULT_CONFIG: StockMoveAlertConfig = {
  enabled: false,
  thresholdPct: 2,
  direction: "both",
  cooldownMinutes: 5,
};

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readAll(): Record<string, StockMoveAlertConfig> {
  if (typeof window === "undefined") {
    return {};
  }

  const parsed = safeParse<Record<string, StockMoveAlertConfig>>(
    window.localStorage.getItem(STORAGE_KEY),
  );

  return parsed ?? {};
}

function writeAll(next: Record<string, StockMoveAlertConfig>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getStockMoveAlertConfig(symbol: string): StockMoveAlertConfig {
  const upper = symbol.trim().toUpperCase();
  const all = readAll();
  const existing = all[upper];
  if (!existing) {
    return { ...DEFAULT_CONFIG };
  }

  return {
    enabled: Boolean(existing.enabled),
    thresholdPct:
      typeof existing.thresholdPct === "number" && Number.isFinite(existing.thresholdPct)
        ? existing.thresholdPct
        : DEFAULT_CONFIG.thresholdPct,
    direction:
      existing.direction === "up" || existing.direction === "down" || existing.direction === "both"
        ? existing.direction
        : DEFAULT_CONFIG.direction,
    cooldownMinutes:
      typeof existing.cooldownMinutes === "number" && Number.isFinite(existing.cooldownMinutes)
        ? existing.cooldownMinutes
        : DEFAULT_CONFIG.cooldownMinutes,
  };
}

export function setStockMoveAlertConfig(symbol: string, config: StockMoveAlertConfig) {
  const upper = symbol.trim().toUpperCase();
  const all = readAll();
  all[upper] = {
    enabled: Boolean(config.enabled),
    thresholdPct: Math.max(0.1, Number(config.thresholdPct) || DEFAULT_CONFIG.thresholdPct),
    direction: config.direction,
    cooldownMinutes: Math.max(0, Number(config.cooldownMinutes) || DEFAULT_CONFIG.cooldownMinutes),
  };
  writeAll(all);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("stock-move-alerts-updated"));
  }
}

export function removeStockMoveAlert(symbol: string) {
  const upper = symbol.trim().toUpperCase();
  const all = readAll();
  if (all[upper]) {
    delete all[upper];
    writeAll(all);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("stock-move-alerts-updated"));
    }
  }
}

export function listEnabledStockMoveAlerts(): Array<{ symbol: string; config: StockMoveAlertConfig }> {
  const all = readAll();
  return Object.entries(all)
    .filter(([, config]) => Boolean(config?.enabled))
    .map(([symbol]) => ({ symbol, config: getStockMoveAlertConfig(symbol) }));
}
