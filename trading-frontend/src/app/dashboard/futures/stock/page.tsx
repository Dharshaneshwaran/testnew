"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFutures } from "@/lib/api/market";
import { FutureContract } from "@/types/market";

export default function StockFuturesPage() {
  const [contracts, setContracts] = useState<FutureContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setContracts(await getFutures("stock"));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load stock futures");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen">
      <Header title="Stock Futures" subtitle="Most active stock derivatives from the backend API" />
      <div className="space-y-3 px-4 py-4 lg:px-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading stock futures...</p>}
        {!loading && !error && contracts.length === 0 && (
          <p className="text-sm text-zinc-500">No stock futures data available right now.</p>
        )}

        {contracts.map((row) => (
          <Card key={row.contract}>
            <CardHeader>
              <CardTitle>{row.contract}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-5">
              <p className="text-zinc-100">LTP: ₹{row.price.toFixed(2)}</p>
              <p className="text-zinc-400">
                OI: {Intl.NumberFormat("en-IN").format(row.openInterest)}
              </p>
              <p className="text-zinc-400">
                Volume: {Intl.NumberFormat("en-IN").format(row.volume)}
              </p>
              <p className="text-zinc-400">Basis: ₹{row.basis.toFixed(2)}</p>
              <p className={row.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}>
                {row.changePercent >= 0 ? "+" : ""}
                {row.changePercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
