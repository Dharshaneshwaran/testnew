"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TradingChart } from "@/components/charts/TradingChart";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFuture, getFutures, getFutureTimeSeries } from "@/lib/api/market";
import { FuturesStreamMessage, openFuturesStream } from "@/lib/api/marketStream";
import { parseTimeMs } from "@/lib/time";
import { FutureContract, PricePoint } from "@/types/market";

export default function IndexFuturesPage() {
  const searchParams = useSearchParams();
  const symbolFilter = (searchParams.get("symbol") ?? "").trim().toUpperCase();

  const [contracts, setContracts] = useState<FutureContract[]>([]);
  const [selected, setSelected] = useState<FutureContract | null>(null);
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [hovered, setHovered] = useState<{
    ohlc: { open: number; high: number; low: number; close: number } | null;
    time: string | null;
  }>({ ohlc: null, time: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (symbolFilter) {
          const [future, series] = await Promise.all([
            getFuture("index", symbolFilter),
            getFutureTimeSeries("index", symbolFilter, { range: "1d", interval: "1m" }),
          ]);
          if (!active) return;
          setSelected(future);
          setChartData(series);
          setContracts([]);
          return;
        }

        const list = await getFutures("index");
        if (!active) return;
        setContracts(list);
        setSelected(null);
        setChartData([]);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load index futures");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [symbolFilter]);

  useEffect(() => {
    if (!symbolFilter) return;

    let active = true;
    setStreamError(null);
    const refreshMs = Number(process.env.NEXT_PUBLIC_MARKET_REFRESH_MS ?? 2000);
    const intervalMs = Number.isFinite(refreshMs) ? refreshMs : 2000;
    const source = openFuturesStream({ kind: "index", symbol: symbolFilter, intervalMs });

    source.onmessage = (event) => {
      if (!active) return;
      let message: FuturesStreamMessage;
      try {
        message = JSON.parse(event.data) as FuturesStreamMessage;
      } catch {
        return;
      }

      if (message.type === "error") {
        setStreamError(message.message || "Live stream error");
        return;
      }
      if (message.type !== "future") return;
      setStreamError(null);

      setSelected((prev) => (prev ? { ...prev, ...message } : (message as unknown as FutureContract)));
      setChartData((prev) =>
        upsertChartPoint(prev, { time: message.timestamp, value: message.price }, 60_000),
      );
    };

    source.onerror = () => {
      if (!active) return;
      setStreamError((prev) => prev ?? "Live stream disconnected");
    };

    return () => {
      active = false;
      source.close();
    };
  }, [symbolFilter]);

  return (
    <main className="min-h-screen">
      <Header
        title={symbolFilter ? `${symbolFilter} Futures` : "Index Futures"}
        subtitle="Live index derivatives snapshot from the backend API"
      />
      <div className="space-y-3 px-4 py-4 lg:px-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {streamError && <p className="text-sm text-amber-300">{streamError}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading index futures...</p>}

        {symbolFilter ? (
          <>
            {selected && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-baseline justify-between gap-3">
                    <span>{selected.contract}</span>
                    <span className="text-xs font-medium text-white/45">
                      {hovered.time ? `Hover: ${hovered.time}` : `Updated: ${formatIst(selected.timestamp)}`}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-5">
                  <p className="text-zinc-100">
                    LTP: ₹{(hovered.ohlc?.close ?? selected.price).toFixed(2)}
                  </p>
                  <p className="text-zinc-400">
                    O: {formatMaybeNumber(hovered.ohlc?.open)}
                  </p>
                  <p className="text-zinc-400">
                    H: {formatMaybeNumber(hovered.ohlc?.high)}
                  </p>
                  <p className="text-zinc-400">
                    L: {formatMaybeNumber(hovered.ohlc?.low)}
                  </p>
                  <p className="text-zinc-400">
                    OI: {Intl.NumberFormat("en-IN").format(selected.openInterest)}
                  </p>
                  <p className="text-zinc-400">
                    Volume: {Intl.NumberFormat("en-IN").format(selected.volume)}
                  </p>
                  <p className="text-zinc-400">Basis: ₹{selected.basis.toFixed(2)}</p>
                  <p className={selected.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {selected.changePercent >= 0 ? "+" : ""}
                    {selected.changePercent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-2 shadow-2xl">
              <TradingChart
                data={chartData}
                variant="candles"
                timeZone="Asia/Kolkata"
                onHoverCandle={(ohlc, time) => setHovered({ ohlc, time })}
              />
            </div>
          </>
        ) : (
          <>
            {!loading && !error && contracts.length === 0 && (
              <p className="text-sm text-zinc-500">No index futures data available right now.</p>
            )}

            {contracts.map((row) => (
              <Card key={row.contract}>
                <CardHeader>
                  <CardTitle>{row.contract}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-5">
                  <p className="text-zinc-100">LTP: ₹{row.price.toFixed(2)}</p>
                  <p className="text-zinc-400">OI: {Intl.NumberFormat("en-IN").format(row.openInterest)}</p>
                  <p className="text-zinc-400">Volume: {Intl.NumberFormat("en-IN").format(row.volume)}</p>
                  <p className="text-zinc-400">Basis: ₹{row.basis.toFixed(2)}</p>
                  <p className={row.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {row.changePercent >= 0 ? "+" : ""}
                    {row.changePercent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </main>
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

  // Never append out-of-order updates (lightweight-charts requires ASC time).
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

function formatIst(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(date);
}

function formatMaybeNumber(value: number | undefined | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }
  return `₹${value.toFixed(2)}`;
}
