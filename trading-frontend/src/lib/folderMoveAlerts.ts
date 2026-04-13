import type { MoveDirection, StockMoveAlertConfig } from "@/lib/stockMoveAlerts";

export type FolderMoveAlertState = {
  enabled: boolean;
  thresholdPct: number;
  direction: MoveDirection;
  cooldownMinutes: number;
  /**
   * Snapshot of per-symbol configs before this folder-level alert enabled them.
   * Used to restore previous state when disabling the folder alert.
   */
  managedSymbols: Record<string, StockMoveAlertConfig>;
};

const STORAGE_KEY = "watchlist_folder_move_alerts_v1";

const DEFAULT_STATE: FolderMoveAlertState = {
  enabled: false,
  thresholdPct: 2,
  direction: "both",
  cooldownMinutes: 5,
  managedSymbols: {},
};

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readAll(): Record<string, FolderMoveAlertState> {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<Record<string, FolderMoveAlertState>>(window.localStorage.getItem(STORAGE_KEY));
  return parsed ?? {};
}

function writeAll(next: Record<string, FolderMoveAlertState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function normalizeState(input: Partial<FolderMoveAlertState> | undefined): FolderMoveAlertState {
  const enabled = Boolean(input?.enabled);
  const thresholdPctRaw = typeof input?.thresholdPct === "number" && Number.isFinite(input.thresholdPct) ? input.thresholdPct : DEFAULT_STATE.thresholdPct;
  const cooldownRaw = typeof input?.cooldownMinutes === "number" && Number.isFinite(input.cooldownMinutes) ? input.cooldownMinutes : DEFAULT_STATE.cooldownMinutes;
  const direction = input?.direction === "up" || input?.direction === "down" || input?.direction === "both" ? input.direction : DEFAULT_STATE.direction;
  const managedSymbols = input?.managedSymbols && typeof input.managedSymbols === "object" ? input.managedSymbols : {};

  return {
    enabled,
    thresholdPct: Math.max(0.1, thresholdPctRaw),
    direction,
    cooldownMinutes: Math.max(0, cooldownRaw),
    managedSymbols,
  };
}

export function getFolderMoveAlertState(folderId: string): FolderMoveAlertState {
  const key = folderId.trim();
  if (!key) return { ...DEFAULT_STATE };
  const all = readAll();
  return normalizeState(all[key]);
}

export function setFolderMoveAlertState(folderId: string, next: FolderMoveAlertState) {
  const key = folderId.trim();
  if (!key) return;
  const all = readAll();
  all[key] = normalizeState(next);
  writeAll(all);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("folder-move-alerts-updated"));
  }
}

