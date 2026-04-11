"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { PriceTicker } from "@/components/market/PriceTicker";
import { getIndexQuotes, getTimeSeries, toTicker } from "@/lib/api/market";
import { PricePoint, Ticker } from "@/types/market";

export default function IndexNsePage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [sparklineMap, setSparklineMap] = useState<Record<string, PricePoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const quotes = await getIndexQuotes(["NIFTY", "BANKNIFTY"]);
        setTickers([
          toTicker(quotes[0], "NIFTY 50"),
          toTicker(quotes[1], "NIFTY BANK"),
        ]);
        setSparklineMap({
          NIFTY: await getTimeSeries("index", "NIFTY", { range: "1d", interval: "30m" }),
          BANKNIFTY: await getTimeSeries("index", "BANKNIFTY", { range: "1d", interval: "30m" }),
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load NSE indices");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen">
      <Header title="Index - NSE" subtitle="Nifty family indices" />
      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 lg:px-6 xl:grid-cols-3">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading indices...</p>}
        {!loading && !error && tickers.length === 0 && (
          <p className="text-sm text-zinc-500">No NSE index data available right now.</p>
        )}
        {tickers.map((ticker) => (
          <PriceTicker key={ticker.symbol} ticker={ticker} sparkline={sparklineMap[ticker.symbol] ?? []} />
        ))}
      </div>
    </main>
  );
}
