"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Maximize2, Plus } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { TradingChart } from "@/components/charts/TradingChart";
import { MarketCard } from "@/components/market/MarketCard";
import { PriceTicker } from "@/components/market/PriceTicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WatchlistFolder } from "@/components/watchlist/WatchlistFolder";
import {
  getEquityQuote,
  getIndexQuotes,
  getMovers,
  getSectors,
  getTimeSeries,
  toTicker,
} from "@/lib/api/market";
import { getWatchlistFolders } from "@/lib/api/watchlist";
import { GainerLoserItem, PricePoint, SectorCard, Ticker } from "@/types/market";
import { WatchlistFolderType } from "@/types/watchlist";

const INDEX_CONFIG = [
  { symbol: "NIFTY", name: "NIFTY 50" },
  { symbol: "SENSEX", name: "BSE SENSEX" },
  { symbol: "BANKNIFTY", name: "NIFTY BANK" },
] as const;

const MARKET_REFRESH_MS = Number(process.env.NEXT_PUBLIC_MARKET_REFRESH_MS ?? "5000");

export default function DashboardPage() {
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
  const [watchlistFolders, setWatchlistFolders] = useState<WatchlistFolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    async function load(showInitialLoading = false) {
      if (inFlight) {
        return;
      }

      inFlight = true;
      if (showInitialLoading) {
        setLoading(true);
      }

      try {
        const [indexQuotes, relianceQuote, moversResponse, sectorsResponse] = await Promise.all([
          getIndexQuotes(INDEX_CONFIG.map((item) => item.symbol)).catch((err) => {
            console.warn(err);
            return [];
          }),
          getEquityQuote("RELIANCE").catch((err) => {
            console.warn(err);
            return null;
          }),
          getMovers().catch((err) => {
            console.warn(err);
            return { gainers: [], losers: [] };
          }),
          getSectors().catch((err) => {
            console.warn(err);
            return [];
          }),
        ]);

        if (!active) {
          return;
        }

        const nextTickers = indexQuotes.map((quote, index) =>
          toTicker(quote, INDEX_CONFIG[index].name),
        );
        setTickers(nextTickers);
        setSparklineMap(
          Object.fromEntries(
            await Promise.all(
              INDEX_CONFIG.map(async (item) => [
                item.symbol,
                await getTimeSeries("index", item.symbol, {
                  range: "1d",
                  interval: "30m",
                }).catch(() => []),
              ]),
            ),
          ),
        );

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

        setChartPoints(
          await getTimeSeries("equity", "RELIANCE", {
            range: "1d",
            interval: "30m",
          }).catch(() => []),
        );

        setTopGainers(moversResponse.gainers);
        setTopLosers(moversResponse.losers);
        setSectors(sectorsResponse);

        if (token) {
          setWatchlistFolders(await getWatchlistFolders(token));
        }

        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
        inFlight = false;
      }
    }

    void load(true);
    intervalId = setInterval(() => {
      void load(false);
    }, MARKET_REFRESH_MS);

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [token]);

  return (
    <main className="min-h-screen">
      <Header title="Dashboard" subtitle="Indian markets overview" />
      <div className="space-y-4 px-4 py-4 lg:px-6">
        {error && <p className="text-sm text-red-400">{error}</p>}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tickers.map((ticker) => (
            <PriceTicker
              key={ticker.symbol}
              ticker={ticker}
              sparkline={sparklineMap[ticker.symbol] ?? []}
            />
          ))}
          {loading && tickers.length === 0 && <p className="text-sm text-zinc-500">Loading market tickers...</p>}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-zinc-100">
                  {selectedStock?.symbol ?? "RELIANCE"}
                </CardTitle>
                <p className="text-sm text-zinc-500">{selectedStock?.name ?? "Loading..."}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedStock ? (
                  <>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <p className="text-3xl font-semibold text-zinc-100">
                        ₹{selectedStock.price.toFixed(2)}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          selectedStock.change >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {selectedStock.change >= 0 ? "+" : ""}
                        {selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                      <span>
                        Volume: {Intl.NumberFormat("en-IN").format(selectedStock.volume)}
                      </span>
                      <span>Day Range: {selectedStock.dayRange}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">Loading stock quote...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <TradingChart data={chartPoints} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sectors Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {sectors.map((sector) => (
                    <div
                      key={sector.name}
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm transition hover:bg-white/[0.04]"
                    >
                      <p className="text-zinc-200">{sector.name}</p>
                      <p className={sector.performance >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {sector.performance >= 0 ? "+" : ""}
                        {sector.performance.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Gainers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topGainers.map((item) => (
                  <MarketCard
                    key={item.symbol}
                    symbol={item.symbol}
                    name={item.name}
                    ltp={item.ltp}
                    changePercent={item.changePercent}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Losers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topLosers.map((item) => (
                  <MarketCard
                    key={item.symbol}
                    symbol={item.symbol}
                    name={item.name}
                    ltp={item.ltp}
                    changePercent={item.changePercent}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
