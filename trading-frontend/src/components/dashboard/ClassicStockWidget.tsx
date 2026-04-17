"use client";

import { useEffect, useState } from "react";
import { X, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { TradingChart } from "@/components/charts/TradingChart";
import { getEquityQuote, getIndexQuote, getTimeSeries, type EquityQuote, type IndexQuote } from "@/lib/api/market";
import { MarketStreamMessage, openMarketStream } from "@/lib/api/marketStream";
import { parseTimeMs } from "@/lib/time";
import { PricePoint } from "@/types/market";
import { cn } from "@/lib/utils";

export function ClassicStockWidget({ 
  symbol, 
  onClose,
  refreshInterval = 1000,
  compact = false,
}: { 
  symbol: string; 
  onClose: () => void;
  refreshInterval?: number;
  compact?: boolean;
}) {
  const [quote, setQuote] = useState<(EquityQuote | IndexQuote) | null>(null);
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let active = true;
    let source: EventSource | null = null;
    const upper = symbol.trim().toUpperCase();
    const isIndex = upper === "NIFTY" || upper === "BANKNIFTY" || upper === "SENSEX";

    async function loadInitial() {
      try {
        const [nextQuote, nextChart] = await Promise.all([
          isIndex ? getIndexQuote(upper) : getEquityQuote(upper),
          getTimeSeries(isIndex ? "index" : "equity", upper, { range: "1d", interval: "1m" })
        ]);

        if (active) {
          setQuote(nextQuote);
          setChartData(nextChart);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to load data for ${symbol}`, err);
      }
    }

    void loadInitial();

    source = openMarketStream({ kind: isIndex ? "index" : "equity", symbol: upper, intervalMs: refreshInterval });

    source.onmessage = (event) => {
      if (!active) return;

      let message: MarketStreamMessage;
      try {
        message = JSON.parse(event.data) as MarketStreamMessage;
      } catch {
        return;
      }

      if (message.type !== "quote") return;

      setQuote((prev) => {
        if (!prev) return prev;
        const update: Partial<EquityQuote | IndexQuote> = {
          price: message.price,
          change: typeof message.change === "number" ? message.change : prev.change,
          changePercent:
            typeof message.changePercent === "number" ? message.changePercent : prev.changePercent,
          open: typeof message.open === "number" ? message.open : prev.open,
          ...(typeof message.volume === "number" ? { volume: message.volume } : null),
          ...(typeof message.dayHigh === "number" ? { dayHigh: message.dayHigh } : null),
          ...(typeof message.dayLow === "number" ? { dayLow: message.dayLow } : null),
          ...(typeof message.high === "number" ? { high: message.high } : null),
          ...(typeof message.low === "number" ? { low: message.low } : null),
          timestamp: message.timestamp,
        };
        if (typeof message.previousClose === "number" && 'previousClose' in prev) {
          (update as Partial<EquityQuote>).previousClose = message.previousClose;
        }
        return { ...prev, ...update };
      });

      setChartData((prev) =>
        upsertChartPoint(prev, { time: message.timestamp, value: message.price }, 60_000),
      );
    };

    return () => {
      active = false;
      source?.close();
    };
  }, [symbol, refreshInterval]);

  useEffect(() => {
    if (!fullscreen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  if (loading || !quote) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse">
        <Activity className="h-8 w-8 text-white/20 animate-spin" />
        <p className="text-sm text-white/40 font-medium">Loading {symbol}...</p>
      </div>
    );
  }

  const isUp = quote.changePercent >= 0;
  const volumeLabel = "volume" in quote ? Intl.NumberFormat("en-IN").format(quote.volume) : "--";
  const highValue = "dayHigh" in quote ? quote.dayHigh : quote.high;
  const chartHeight = fullscreen ? 520 : compact ? 220 : 334;
  const effectiveCompact = fullscreen ? false : compact;

  const content = (
    <div
      className={cn(
        "group relative flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-[#0d0f14] shadow-2xl transition-all hover:border-white/20",
        effectiveCompact ? "overflow-hidden" : "",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-white/5",
          effectiveCompact ? "px-4 py-3" : "px-5 py-4",
        )}
      >
        <button
          type="button"
          onDoubleClick={() => setFullscreen(true)}
          className="flex min-w-0 items-center gap-3 text-left"
          title="Double-click to fullscreen"
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isUp ? "bg-emerald-400" : "bg-red-400",
            )}
          />
          <h3
            className={cn(
              "truncate font-bold tracking-tight text-white",
              effectiveCompact ? "text-[15px]" : "text-lg",
            )}
          >
            {symbol}
          </h3>
        </button>

        <button
          onClick={fullscreen ? () => setFullscreen(false) : onClose}
          className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white transition-all"
          title={fullscreen ? "Exit fullscreen" : "Remove"}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col gap-3", effectiveCompact ? "p-4" : "p-5 gap-4")}>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className={cn("font-bold tracking-tighter text-white", effectiveCompact ? "text-2xl" : "text-3xl")}>
              ₹{quote.price.toFixed(2)}
            </p>
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-semibold",
                isUp ? "text-emerald-400" : "text-red-400",
              )}
            >
              {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%
            </div>
          </div>
          {!effectiveCompact && (
            <div className="text-right text-[11px] text-white/40 font-medium uppercase tracking-wider space-y-0.5">
              <p>Vol: {volumeLabel}</p>
              <p>High: ₹{highValue.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className={cn("relative min-h-0 flex-1 rounded-xl bg-black/20 border border-white/5", effectiveCompact ? "p-1.5" : "p-2")}>
          <TradingChart data={chartData} height={chartHeight} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {content}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm p-4">
          <div className="mx-auto h-full w-full max-w-[1200px]">{content}</div>
        </div>
      )}
    </>
  );
}

function upsertChartPoint(points: PricePoint[], incoming: PricePoint, bucketMs: number) {
  if (points.length === 0) {
    return [incoming];
  }

  const incomingTime = parseTimeMs(incoming.time);
  if (incomingTime === null) {
    return points;
  }

  const lastIndex = points.length - 1;
  const last = points[lastIndex];
  if (!last) {
    return [incoming];
  }

  const lastTime = parseTimeMs(last.time);
  if (lastTime === null) {
    return [...points, incoming];
  }

  const incomingBucket = Math.floor(incomingTime / bucketMs);
  const lastBucket = Math.floor(lastTime / bucketMs);
  if (incomingTime < lastTime) {
    if (incomingBucket <= lastBucket) {
      const next = [...points];
      next[lastIndex] = { time: last.time, value: incoming.value };
      return next;
    }
    return points;
  }
  if (incomingBucket === lastBucket) {
    const next = [...points];
    next[lastIndex] = incoming;
    return next;
  }

  return [...points, incoming];
}
