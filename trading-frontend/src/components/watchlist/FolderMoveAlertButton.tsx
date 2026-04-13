"use client";

import { AlertTriangle, Bell, BellRing } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ensureNotificationPermission } from "@/lib/notifications";
import { getFolderMoveAlertState, setFolderMoveAlertState, type FolderMoveAlertState } from "@/lib/folderMoveAlerts";
import { getStockMoveAlertConfig, setStockMoveAlertConfig, type StockMoveAlertConfig } from "@/lib/stockMoveAlerts";
import { cn } from "@/lib/utils";

function normalizeSymbols(symbols: string[]) {
  return Array.from(
    new Set(
      symbols
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
}

export function FolderMoveAlertButton({
  folderId,
  folderName,
  symbols,
  className,
}: {
  folderId: string;
  folderName: string;
  symbols: string[];
  className?: string;
}) {
  const normalizedSymbols = useMemo(() => normalizeSymbols(symbols), [symbols]);
  const [state, setState] = useState<FolderMoveAlertState>(() => ({
    enabled: false,
    thresholdPct: 2,
    direction: "both",
    cooldownMinutes: 5,
    managedSymbols: {},
  }));
  const [open, setOpen] = useState(false);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);

  useEffect(() => {
    setState(getFolderMoveAlertState(folderId));
  }, [folderId]);

  useEffect(() => {
    function refresh() {
      setState(getFolderMoveAlertState(folderId));
    }

    const onUpdate = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "watchlist_folder_move_alerts_v1") {
        refresh();
      }
    };

    window.addEventListener("folder-move-alerts-updated", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("folder-move-alerts-updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [folderId]);

  const enabled = state.enabled;
  const disabledBecauseEmpty = normalizedSymbols.length === 0;
  const thresholdPct = state.thresholdPct;
  const direction = state.direction;
  const cooldownMinutes = state.cooldownMinutes;
  const managedSymbolsState = state.managedSymbols;

  useEffect(() => {
    if (!enabled || disabledBecauseEmpty) return;

    const missing = normalizedSymbols.filter((symbol) => !managedSymbolsState[symbol]);
    if (missing.length === 0) return;

    const managedSymbols: Record<string, StockMoveAlertConfig> = { ...managedSymbolsState };
    for (const symbol of missing) {
      managedSymbols[symbol] = getStockMoveAlertConfig(symbol);
      setStockMoveAlertConfig(symbol, {
        enabled: true,
        thresholdPct,
        direction,
        cooldownMinutes,
      });
    }

    const nextState: FolderMoveAlertState = {
      enabled: true,
      thresholdPct,
      direction,
      cooldownMinutes,
      managedSymbols,
    };
    setFolderMoveAlertState(folderId, nextState);
    setState(nextState);
  }, [
    enabled,
    disabledBecauseEmpty,
    folderId,
    normalizedSymbols,
    cooldownMinutes,
    direction,
    managedSymbolsState,
    thresholdPct,
  ]);

  const applyToSymbols = (config: StockMoveAlertConfig) => {
    for (const symbol of normalizedSymbols) {
      setStockMoveAlertConfig(symbol, config);
    }
  };

  const enableFolderAlerts = async (next: FolderMoveAlertState) => {
    setPermissionWarning(null);
    const permission = await ensureNotificationPermission();
    if (permission !== "granted") {
      setPermissionWarning("Notifications are blocked. Enable browser notifications to receive push-like alerts.");
    }

    const managedSymbols: Record<string, StockMoveAlertConfig> = { ...next.managedSymbols };
    for (const symbol of normalizedSymbols) {
      if (!managedSymbols[symbol]) {
        managedSymbols[symbol] = getStockMoveAlertConfig(symbol);
      }
    }

    const nextState: FolderMoveAlertState = {
      ...next,
      enabled: true,
      managedSymbols,
    };

    setFolderMoveAlertState(folderId, nextState);
    setState(nextState);

    applyToSymbols({
      enabled: true,
      thresholdPct: nextState.thresholdPct,
      direction: nextState.direction,
      cooldownMinutes: nextState.cooldownMinutes,
    });
  };

  const disableFolderAlerts = () => {
    const current = getFolderMoveAlertState(folderId);
    const managed = current.managedSymbols ?? {};

    for (const [symbol, previous] of Object.entries(managed)) {
      setStockMoveAlertConfig(symbol, previous);
    }

    const nextState: FolderMoveAlertState = {
      ...current,
      enabled: false,
      managedSymbols: {},
    };

    setFolderMoveAlertState(folderId, nextState);
    setState(nextState);
  };

  const toggleQuick = async () => {
    if (disabledBecauseEmpty) return;
    if (enabled) {
      disableFolderAlerts();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void toggleQuick()}
        disabled={disabledBecauseEmpty}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
          enabled
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white",
          disabledBecauseEmpty && "opacity-40 hover:bg-white/5 hover:text-zinc-400 cursor-not-allowed",
          className,
        )}
        title={
          disabledBecauseEmpty
            ? "Add symbols to enable alerts"
            : enabled
              ? "Sudden-move alerts enabled for this list"
              : "Enable sudden-move alerts for this list"
        }
        aria-label={enabled ? "Disable list alerts" : "Enable list alerts"}
      >
        {enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">List sudden move alerts</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Notify when any symbol in <span className="font-medium text-zinc-200">{folderName}</span> moves quickly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">Threshold (%)</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={state.thresholdPct}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        thresholdPct: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">Direction</span>
                  <select
                    value={state.direction}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        direction: event.target.value as StockMoveAlertConfig["direction"],
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-400"
                  >
                    <option value="both">Up or down</option>
                    <option value="up">Only up</option>
                    <option value="down">Only down</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">Cooldown (minutes)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={state.cooldownMinutes}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        cooldownMinutes: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-400"
                  />
                </label>

                {permissionWarning && (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                    <p className="text-sm text-amber-200">{permissionWarning}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void enableFolderAlerts(state).then(() => setOpen(false))}
                    className="flex-1 rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400"
                  >
                    Enable for list
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
