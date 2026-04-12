"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getEquityQuote } from "@/lib/api/market";
import { sendNotification } from "@/lib/notifications";
import { listEnabledStockMoveAlerts, MoveDirection, StockMoveAlertConfig } from "@/lib/stockMoveAlerts";

type Toast = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

const POLL_MS = 30_000;

function directionMatches(direction: MoveDirection, deltaPct: number) {
  if (direction === "both") return true;
  if (direction === "up") return deltaPct > 0;
  if (direction === "down") return deltaPct < 0;
  return true;
}

function formatDelta(deltaPct: number) {
  const sign = deltaPct >= 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(2)}%`;
}

export function StockMoveAlertMonitor() {
  const [enabledAlerts, setEnabledAlerts] = useState<Array<{ symbol: string; config: StockMoveAlertConfig }>>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const enabledSymbols = useMemo(() => enabledAlerts.map((a) => a.symbol), [enabledAlerts]);

  const lastTickRef = useRef<Map<string, { price: number; at: number }>>(new Map());
  const lastNotifiedRef = useRef<Map<string, number>>(new Map());
  const inflightRef = useRef(false);

  useEffect(() => {
    function refresh() {
      setEnabledAlerts(listEnabledStockMoveAlerts());
    }

    refresh();

    const onUpdate = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "stock_move_alerts_v1") {
        refresh();
      }
    };

    window.addEventListener("stock-move-alerts-updated", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("stock-move-alerts-updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    // Clean up cached state for disabled symbols.
    const enabled = new Set(enabledSymbols);
    for (const key of Array.from(lastTickRef.current.keys())) {
      if (!enabled.has(key)) lastTickRef.current.delete(key);
    }
    for (const key of Array.from(lastNotifiedRef.current.keys())) {
      if (!enabled.has(key)) lastNotifiedRef.current.delete(key);
    }
  }, [enabledSymbols]);

  useEffect(() => {
    if (enabledAlerts.length === 0) {
      return;
    }

    let cancelled = false;

    async function pollOnce() {
      if (inflightRef.current) return;
      inflightRef.current = true;

      try {
        const now = Date.now();

        await Promise.all(
          enabledAlerts.map(async ({ symbol, config }) => {
            try {
              const quote = await getEquityQuote(symbol);
              const prev = lastTickRef.current.get(symbol);

              lastTickRef.current.set(symbol, { price: quote.price, at: now });

              if (!prev || prev.price <= 0) {
                return;
              }

              const deltaPct = ((quote.price - prev.price) / prev.price) * 100;
              if (!directionMatches(config.direction, deltaPct)) {
                return;
              }

              if (Math.abs(deltaPct) < config.thresholdPct) {
                return;
              }

              const cooldownMs = Math.max(0, config.cooldownMinutes) * 60_000;
              const lastNotifiedAt = lastNotifiedRef.current.get(symbol) ?? 0;
              if (cooldownMs > 0 && now - lastNotifiedAt < cooldownMs) {
                return;
              }

              lastNotifiedRef.current.set(symbol, now);

              const seconds = Math.max(1, Math.round((now - prev.at) / 1000));
              const title = `${symbol} sudden move`;
              const body = `${quote.price.toFixed(2)} (${formatDelta(deltaPct)}) in ~${seconds}s`;

              sendNotification(title, {
                body,
                tag: `stock-move-${symbol}`,
              });

              setToasts((current) => [
                {
                  id: `${symbol}-${now}`,
                  title,
                  body,
                  createdAt: now,
                },
                ...current,
              ].slice(0, 3));
            } catch {
              // ignore per-symbol failures
            }
          }),
        );
      } finally {
        inflightRef.current = false;
      }
    }

    void pollOnce();
    const interval = window.setInterval(() => {
      if (!cancelled) {
        void pollOnce();
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabledAlerts]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      const cutoff = Date.now() - 6_000;
      setToasts((current) => current.filter((toast) => toast.createdAt >= cutoff));
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [toasts.length]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-[320px] rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 shadow-2xl backdrop-blur"
        >
          <p className="text-sm font-semibold text-zinc-100">{toast.title}</p>
          <p className="mt-1 text-xs text-zinc-400">{toast.body}</p>
        </div>
      ))}
    </div>
  );
}
