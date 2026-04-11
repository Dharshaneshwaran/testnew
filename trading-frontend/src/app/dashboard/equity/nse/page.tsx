"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { MarketCard } from "@/components/market/MarketCard";
import { getEquityQuotes } from "@/lib/api/market";

const NSE_SYMBOLS = [
  "RELIANCE",
  "HDFCBANK",
  "TCS",
  "ITC",
  "SBIN",
  "INFY",
  "ONGC",
  "TATAMOTORS",
];

export default function EquityNsePage() {
  const [quotes, setQuotes] = useState<
    { symbol: string; ltp: number; changePercent: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await getEquityQuotes(NSE_SYMBOLS);
        setQuotes(
          response.map((quote) => ({
            symbol: quote.symbol,
            ltp: quote.price,
            changePercent: quote.changePercent,
          })),
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load NSE equities");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen">
      <Header title="Cash / Equity - NSE" subtitle="NSE stocks movers" />
      <div className="grid gap-4 px-4 py-4 md:grid-cols-2 lg:px-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading equities...</p>}
        {!loading && !error && quotes.length === 0 && (
          <p className="text-sm text-zinc-500">No NSE equity quotes available right now.</p>
        )}
        {quotes.map((item) => (
          <MarketCard
            key={item.symbol}
            symbol={item.symbol}
            name={item.symbol}
            ltp={item.ltp}
            changePercent={item.changePercent}
          />
        ))}
      </div>
    </main>
  );
}
