"use client";

import { useEffect, useState } from "react";
import { X, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { TradingChart } from "@/components/charts/TradingChart";
import { getEquityQuote, getTimeSeries, type EquityQuote } from "@/lib/api/market";
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

    async function loadData() {
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

    loadData();
    const timer = setInterval(loadData, refreshInterval);

    return () => {
      active = false;
      clearInterval(timer);
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
