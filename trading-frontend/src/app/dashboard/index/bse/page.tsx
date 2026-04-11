"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { PriceTicker } from "@/components/market/PriceTicker";
import { getIndexQuote, getTimeSeries, toTicker } from "@/lib/api/market";
import { PricePoint, Ticker } from "@/types/market";

export default function IndexBsePage() {
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [sparkline, setSparkline] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const quote = await getIndexQuote("SENSEX");
        setTicker(toTicker(quote, "BSE SENSEX"));
        setSparkline(
          await getTimeSeries("index", "SENSEX", { range: "1d", interval: "30m" }),
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load BSE index");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen">
      <Header title="Index - BSE" subtitle="Sensex and BSE benchmarks" />
      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 lg:px-6 xl:grid-cols-3">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading indices...</p>}
        {!loading && !error && !ticker && (
          <p className="text-sm text-zinc-500">No BSE index data available right now.</p>
        )}
        {ticker && <PriceTicker ticker={ticker} sparkline={sparkline} />}
      </div>
    </main>
  );
}
