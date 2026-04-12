"use client";

import { Bell, BellRing, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ensureNotificationPermission } from "@/lib/notifications";
import { getStockMoveAlertConfig, setStockMoveAlertConfig, StockMoveAlertConfig } from "@/lib/stockMoveAlerts";
import { cn } from "@/lib/utils";

export function StockMoveAlertButton({ symbol, className }: { symbol: string; className?: string }) {
  const upper = useMemo(() => symbol.trim().toUpperCase(), [symbol]);
  const [config, setConfig] = useState<StockMoveAlertConfig>(() => ({
    enabled: false,
    thresholdPct: 2,
    direction: "both",
    cooldownMinutes: 5,
  }));
  const [open, setOpen] = useState(false);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getStockMoveAlertConfig(upper));
  }, [upper]);

  const enabled = config.enabled;

  const save = async (next: StockMoveAlertConfig) => {
    setPermissionWarning(null);
    if (next.enabled) {
      const permission = await ensureNotificationPermission();
      if (permission !== "granted") {
        setPermissionWarning("Notifications are blocked. Enable browser notifications to receive push-like alerts.");
      }
    }

    setStockMoveAlertConfig(upper, next);
    setConfig(next);
  };

  const toggleQuick = async () => {
    if (enabled) {
      await save({ ...config, enabled: false });
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void toggleQuick()}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
          enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white",
          className,
        )}
        title={enabled ? "Sudden-move alert enabled" : "Enable sudden-move alert"}
      >
        {enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Sudden move alert</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Get a notification when <span className="font-medium text-zinc-200">{upper}</span> moves quickly.
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
                    value={config.thresholdPct}
                    onChange={(event) =>
                      setConfig((current) => ({
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
                    value={config.direction}
                    onChange={(event) =>
                      setConfig((current) => ({
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
                    value={config.cooldownMinutes}
                    onChange={(event) =>
                      setConfig((current) => ({
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
                    onClick={() => void save({ ...config, enabled: true }).then(() => setOpen(false))}
                    className="flex-1 rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400"
                  >
                    Enable alert
                  </button>
                </div>

                {enabled && (
                  <button
                    type="button"
                    onClick={() => void save({ ...config, enabled: false }).then(() => setOpen(false))}
                    className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                  >
                    Disable for {upper}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

