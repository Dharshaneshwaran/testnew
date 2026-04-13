"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronDown, Maximize2, Plus, Monitor, LayoutGrid, Layout } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboard } from "@/context/DashboardContext";
import { Header } from "@/components/layout/Header";
import { TradingChart } from "@/components/charts/TradingChart";
import { MarketCard } from "@/components/market/MarketCard";
import { PriceTicker } from "@/components/market/PriceTicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassicStockWidget } from "@/components/dashboard/ClassicStockWidget";
import {
  getEquityQuote,
  getIndexQuotes,
  getMovers,
  getSectors,
  getTimeSeries,
  toTicker,
} from "@/lib/api/market";
import { GainerLoserItem, PricePoint, SectorCard, Ticker } from "@/types/market";
import { cn } from "@/lib/utils";

const INDEX_CONFIG = [
  { symbol: "NIFTY", name: "NIFTY 50" },
  { symbol: "SENSEX", name: "BSE SENSEX" },
  { symbol: "BANKNIFTY", name: "NIFTY BANK" },
] as const;

function DashboardSlot({ 
  index, 
  symbol, 
  onClose 
}: { 
  index: number; 
  symbol: string | null; 
  onClose: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    data: { index }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
        symbol ? "border-transparent bg-transparent" : "border-white/10 bg-white/[0.02] hover:border-white/20",
        isOver && !symbol && "border-blue-500/50 bg-blue-500/5 scale-[0.98]"
      )}
    >
      {symbol ? (
        <div className="h-full w-full">
          <ClassicStockWidget symbol={symbol} onClose={onClose} refreshInterval={1000} compact />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-white/5 p-4 text-white/20">
            <Plus className="h-8 w-8" />
          </div>
          <p className="max-w-[160px] text-sm font-medium text-white/30">
            {isOver ? "Drop to monitor" : `Slot ${index + 1} - Drag a stock here`}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { mode, dashboardStocks, setSlot } = useDashboard();
  const { token } = useAuth();
  
  // Beta Mode State
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [sparklineMap, setSparklineMap] = useState<Record<string, PricePoint[]>>({});
  const [chartPoints, setChartPoints] = useState<PricePoint[]>([]);
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    dayRange: string;
  } | null>(null);
  const [topGainers, setTopGainers] = useState<GainerLoserItem[]>([]);
  const [topLosers, setTopLosers] = useState<GainerLoserItem[]>([]);
  const [sectors, setSectors] = useState<SectorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const REFRESH_RATE = mode === "classic" ? 1000 : 5000;

  useEffect(() => {
    if (mode === "classic") return;

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function load(showInitialLoading = false) {
      if (showInitialLoading) setLoading(true);
      try {
        const [indexQuotes, relianceQuote, moversResponse, sectorsResponse] = await Promise.all([
          getIndexQuotes(INDEX_CONFIG.map((item) => item.symbol)).catch(() => []),
          getEquityQuote("RELIANCE").catch(() => null),
          getMovers().catch(() => ({ gainers: [], losers: [] })),
          getSectors().catch(() => []),
        ]);

        if (!active) return;

        setTickers(indexQuotes.map((quote, idx) => toTicker(quote, INDEX_CONFIG[idx].name)));
        
        const sparks = await Promise.all(
          INDEX_CONFIG.map(async (item) => [
            item.symbol,
            await getTimeSeries("index", item.symbol, { range: "1d", interval: "30m" }).catch(() => []),
          ])
        );
        setSparklineMap(Object.fromEntries(sparks));

        if (relianceQuote) {
          setSelectedStock({
            symbol: relianceQuote.symbol,
            name: "Reliance Industries Ltd.",
            price: relianceQuote.price,
            change: relianceQuote.change,
            changePercent: relianceQuote.changePercent,
            volume: relianceQuote.volume,
            dayRange: `${relianceQuote.dayLow.toFixed(2)} - ${relianceQuote.dayHigh.toFixed(2)}`,
          });
        }

        setChartPoints(await getTimeSeries("equity", "RELIANCE", { range: "1d", interval: "30m" }).catch(() => []));
        setTopGainers(moversResponse.gainers);
        setTopLosers(moversResponse.losers);
        setSectors(sectorsResponse);
        setError(null);
      } catch (err) {
        if (active) setError("Failed to load dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    }

    load(true);
    intervalId = setInterval(load, REFRESH_RATE);
    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [mode, token, REFRESH_RATE]);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header 
        title={mode === "classic" ? "Classic Console" : "Dashboard"} 
        subtitle={mode === "classic" ? "Multi-chart monitoring enabled" : "Indian markets overview"} 
      />
      
      {mode === "classic" ? (
        <div className="px-4 py-6 lg:px-8 min-h-[calc(100vh-85px)] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Active Terminal (4 Stocks Max)</h2>
          </div>

          <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 md:grid-cols-2 md:grid-rows-2 md:auto-rows-fr">
            {dashboardStocks.map((symbol, idx) => (
              <DashboardSlot 
                key={idx} 
                index={idx} 
                symbol={symbol} 
                onClose={() => setSlot(idx, null)} 
              />
            ))}
          </div>
        </div>
        ) : (
          <div className="px-4 py-6 lg:px-8 space-y-4">
            {error && <p className="text-sm text-red-400">{error}</p>}

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {tickers.map((ticker) => (
                <PriceTicker key={ticker.symbol} ticker={ticker} sparkline={sparklineMap[ticker.symbol] ?? []} />
              ))}
              {loading && tickers.length === 0 && <p className="text-sm text-zinc-500">Loading market tickers...</p>}
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-zinc-100">{selectedStock?.symbol ?? "RELIANCE"}</CardTitle>
                    <p className="text-sm text-zinc-500">{selectedStock?.name ?? "Reliance Industries Ltd."}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedStock ? (
                      <>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <p className="text-3xl font-semibold text-zinc-100">₹{selectedStock.price.toFixed(2)}</p>
                          <p className={`text-sm font-medium ${selectedStock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {selectedStock.change >= 0 ? "+" : ""}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                          <span>Volume: {Intl.NumberFormat("en-IN").format(selectedStock.volume)}</span>
                          <span>Day Range: {selectedStock.dayRange}</span>
                        </div>
                      </>
                    ) : <p className="text-sm text-zinc-500">Loading stock quote...</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Price Chart</CardTitle></CardHeader>
                  <CardContent><TradingChart data={chartPoints} /></CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Sectors Snapshot</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {sectors.map((sector) => (
                        <div key={sector.name} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm transition hover:bg-white/[0.04]">
                          <p className="text-zinc-200">{sector.name}</p>
                          <p className={sector.performance >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {sector.performance >= 0 ? "+" : ""}{sector.performance.toFixed(2)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Top Gainers</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {topGainers.map((item) => (
                      <MarketCard key={item.symbol} symbol={item.symbol} name={item.name} ltp={item.ltp} changePercent={item.changePercent} />
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Top Losers</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {topLosers.map((item) => (
                      <MarketCard key={item.symbol} symbol={item.symbol} name={item.name} ltp={item.ltp} changePercent={item.changePercent} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        )}
      </main>
    );
  }
