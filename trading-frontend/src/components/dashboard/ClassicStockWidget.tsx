"use client";

import { useEffect, useState } from "react";
import { X, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { TradingChart } from "@/components/charts/TradingChart";
import { getEquityQuote, getTimeSeries, type EquityQuote } from "@/lib/api/market";
import { MarketStreamMessage, openMarketStream } from "@/lib/api/marketStream";
import { PricePoint } from "@/types/market";
import { cn } from "@/lib/utils";

export function ClassicStockWidget({ 
  symbol, 
  onClose,
  refreshInterval = 1000 
}: { 
  symbol: string; 
  onClose: () => void;
  refreshInterval?: number;
}) {
  const [quote, setQuote] = useState<EquityQuote | null>(null);
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let source: EventSource | null = null;

    async function loadInitial() {
      try {
        const [nextQuote, nextChart] = await Promise.all([
          getEquityQuote(symbol),
          getTimeSeries("equity", symbol, { range: "1d", interval: "1m" })
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

    source = openMarketStream({ kind: "equity", symbol, intervalMs: refreshInterval });

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
        return {
          ...prev,
          price: message.price,
          change: typeof message.change === "number" ? message.change : prev.change,
          changePercent:
            typeof message.changePercent === "number" ? message.changePercent : prev.changePercent,
          open: typeof message.open === "number" ? message.open : prev.open,
          previousClose:
            typeof message.previousClose === "number" ? message.previousClose : prev.previousClose,
          volume: typeof message.volume === "number" ? message.volume : prev.volume,
          dayHigh: typeof message.dayHigh === "number" ? message.dayHigh : prev.dayHigh,
          dayLow: typeof message.dayLow === "number" ? message.dayLow : prev.dayLow,
          timestamp: message.timestamp,
        };
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

  if (loading || !quote) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse">
        <Activity className="h-8 w-8 text-white/20 animate-spin" />
        <p className="text-sm text-white/40 font-medium">Loading {symbol}...</p>
      </div>
    );
  }

  const isUp = quote.changePercent >= 0;

  return (
    <div className="group relative flex h-full min-h-[300px] flex-col rounded-2xl border border-white/10 bg-[#0d0f14] shadow-2xl transition-all hover:border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isUp ? "bg-emerald-400" : "bg-red-400"
          )} />
          <h3 className="text-lg font-bold tracking-tight text-white">{symbol}</h3>
        </div>
        <button 
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 gap-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tighter text-white">
              ₹{quote.price.toFixed(2)}
            </p>
            <div className={cn(
              "flex items-center gap-1.5 text-sm font-semibold",
              isUp ? "text-emerald-400" : "text-red-400"
            )}>
              {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%
            </div>
          </div>
          <div className="text-right text-[11px] text-white/40 font-medium uppercase tracking-wider space-y-0.5">
            <p>Vol: {Intl.NumberFormat("en-IN").format(quote.volume)}</p>
            <p>High: ₹{quote.dayHigh.toFixed(2)}</p>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative flex-1 rounded-xl bg-black/20 p-2 border border-white/5">
          <TradingChart data={chartData} />
        </div>
      </div>
    </div>
  );
}

function upsertChartPoint(points: PricePoint[], incoming: PricePoint, bucketMs: number) {
  if (points.length === 0) {
    return [incoming];
  }

  const incomingTime = new Date(incoming.time).getTime();
  if (!Number.isFinite(incomingTime)) {
    return points;
  }

  const lastIndex = points.length - 1;
  const last = points[lastIndex];
  if (!last) {
    return [incoming];
  }

  const lastTime = new Date(last.time).getTime();
  if (!Number.isFinite(lastTime)) {
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
