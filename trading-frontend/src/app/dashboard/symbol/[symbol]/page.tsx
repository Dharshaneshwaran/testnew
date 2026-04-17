"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Pencil,
  Plus,
  ScanSearch,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { TradingChart, type TradingChartVariant } from "@/components/charts/TradingChart";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { MarketResearch, PricePoint } from "@/types/market";
import { useAuth } from "@/components/auth/AuthProvider";
import { addWatchlistItem, getWatchlistFolders, createWatchlistFolder } from "@/lib/api/watchlist";
import { getResearch, getTimeSeries } from "@/lib/api/market";
import { MarketStreamMessage, openMarketStream } from "@/lib/api/marketStream";
import { StockMoveAlertButton } from "@/components/watchlist/StockMoveAlertButton";
import { parseTimeMs } from "@/lib/time";

const RANGE_TABS = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const;
const CONTENT_TABS = ["Overview", "Earnings", "Financials"] as const;
const RESEARCH_SITES = ["marketsmojo", "Alpha", "Motilal"];
const INDEX_SYMBOLS = new Set(["NIFTY", "BANKNIFTY", "SENSEX"]);

export default function SymbolResearchPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = String(params.symbol ?? "").toUpperCase();
  const [research, setResearch] = useState<MarketResearch | null>(null);
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] =
    useState<(typeof CONTENT_TABS)[number]>("Overview");
  const [activeRange, setActiveRange] = useState<(typeof RANGE_TABS)[number]>("1D");
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [chartVariant, setChartVariant] = useState<TradingChartVariant>("area");
  const [chartTypeMenuOpen, setChartTypeMenuOpen] = useState(false);
  const chartTypeRef = useRef<HTMLDivElement | null>(null);

  const { token } = useAuth();
  const [addingToList, setAddingToList] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!chartTypeMenuOpen) {
      return;
    }

    const handler = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && chartTypeRef.current && !chartTypeRef.current.contains(target)) {
        setChartTypeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [chartTypeMenuOpen]);

  const handleAddToList = async () => {
    if (!token) {
      alert("Please login to add to watchlist");
      return;
    }

    setAddingToList(true);
    try {
      const folders = await getWatchlistFolders(token);
      let targetFolderId = folders[0]?.id;

      if (!targetFolderId) {
        const defaultFolder = await createWatchlistFolder(token, "My Watchlist");
        targetFolderId = defaultFolder.id;
      } else {
        const targetFolder = folders.find(f => f.id === targetFolderId);
        if (targetFolder?.items.some(item => item.symbol === symbol)) {
          alert("This symbol is already in your watchlist.");
          setAdded(true);
          return;
        }
      }

      await addWatchlistItem(token, targetFolderId, symbol, research?.exchange);
      setAdded(true);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setAddingToList(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [researchResponse, chartResponse] = await Promise.all([
          getResearch(symbol).catch((err: unknown) => {
            console.warn(err);
            return null;
          }),
          getTimeSeries(isIndexSymbol(symbol) ? "index" : "equity", symbol, {
            range: activeRange.toLowerCase(),
            interval: getRangeInterval(activeRange),
          }).catch((err: unknown) => {
            console.warn(err);
            return [];
          }),
        ]);

        if (!active) {
          return;
        }

        setResearch(researchResponse);
        setChartData(chartResponse || []);
        if (!researchResponse && (!chartResponse || chartResponse.length === 0)) {
          setError("Failed to load symbol data");
        } else {
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load research");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [symbol, activeRange]);

  useEffect(() => {
    if (!symbol) return;
    if (activeRange !== "1D" && activeRange !== "5D") return;

    setStreamError(null);
    const refreshMs = Number(process.env.NEXT_PUBLIC_MARKET_REFRESH_MS ?? 5000);
    const intervalMs = Number.isFinite(refreshMs) ? refreshMs : 5000;
    const interval = getRangeInterval(activeRange);
    const bucketMs = intervalToBucketMs(interval);

    const streamKind = isIndexSymbol(symbol) ? "index" : "equity";
    const source = openMarketStream({ kind: streamKind, symbol, intervalMs });

    source.onmessage = (event) => {
      let message: MarketStreamMessage;
      try {
        message = JSON.parse(event.data) as MarketStreamMessage;
      } catch {
        return;
      }

      if (message.type === "error") {
        setStreamError(message.message || "Live stream error");
        return;
      }
      if (message.type !== "quote") return;
      setStreamError(null);

      setResearch((prev) => {
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
        upsertChartPoint(prev, { time: message.timestamp, value: message.price }, bucketMs),
      );
    };

    source.onerror = () => {
      setStreamError((prev) => prev ?? "Live stream disconnected");
    };

    return () => {
      source.close();
    };
  }, [symbol, activeRange]);

  const isPositive = (research?.change ?? 0) >= 0;
  const headline = useMemo(() => {
    if (!research) {
      return symbol;
    }

    return `${research.exchange}:${symbol}`;
  }, [research, symbol]);
  const lastUpdatedLabel = research ? formatResearchTimestamp(research.timestamp) : "Loading...";

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header title="Research" subtitle="Market research" />
      <div className="flex flex-col min-h-[calc(100vh-85px)]">
        <section className="px-4 py-5 lg:px-7">
          <div className="flex flex-wrap items-center gap-3 text-[15px] text-white/68">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/88">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span className="text-white/25">|</span>
            <span>{headline}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[26px] font-medium tracking-[-0.03em] text-white">
                {research?.name ?? symbol}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-[22px] font-medium text-white transition-all">
                  {hoveredPrice !== null ? formatCurrency(hoveredPrice) : formatCurrency(research?.price)}
                </p>
                {hoveredPrice !== null ? (
                  <p className="text-[14px] text-white/54">{hoveredTime}</p>
                ) : (
                <p
                  className={cn(
                    "text-[20px] font-medium",
                    isPositive ? "text-[#8ee78f]" : "text-[#f28b82]",
                  )}
                >
                  {formatSignedPercent(research?.changePercent)}
                  {" "}
                  ({formatSignedCurrency(research?.change)}) Today
                </p>
                )}
              </div>
              <p className="mt-2 text-[14px] text-white/54">
                {lastUpdatedLabel} <span className="px-2 text-white/24">•</span> INR
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StockMoveAlertButton symbol={symbol} className="h-11 w-11" />
              <button
                type="button"
                onClick={handleAddToList}
                disabled={addingToList || added}
                className={cn(
                  "inline-flex h-11 items-center gap-3 rounded-full px-6 text-[16px] font-medium transition",
                  added ? "bg-emerald-500/20 text-emerald-400" : "bg-[#2a3142] text-white hover:bg-[#31394d]"
                )}
              >
                <Plus className="h-5 w-5" />
                {addingToList ? "Adding..." : added ? "Added" : "Add to list"}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[22px] border border-white/5 bg-[#14171f]">
            <div className="flex flex-wrap gap-1 border-b border-white/7 px-4 py-3">
              <div ref={chartTypeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setChartTypeMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[15px] text-white/86 transition hover:bg-white/[0.04]"
                  aria-label="Chart type"
                >
                  <BarChart3 className="h-4 w-4" />
                  {chartVariant === "area" ? "Area" : chartVariant === "candles" ? "Candles" : "Line"}
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </button>

                {chartTypeMenuOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#13151d] shadow-2xl">
                    {[
                      { value: "area" as const, label: "Area" },
                      { value: "candles" as const, label: "Candles" },
                      { value: "line" as const, label: "Line" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setChartVariant(item.value);
                          setChartTypeMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-white/[0.04]",
                          chartVariant === item.value ? "text-emerald-200" : "text-zinc-200",
                        )}
                      >
                        <span className="font-medium">{item.label}</span>
                        {chartVariant === item.value && <span className="text-xs text-emerald-200">Selected</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[15px] text-white/40"
                aria-label="Compare (coming soon)"
                title="Coming soon"
              >
                <TrendingUp className="h-4 w-4" />
                Compare
                <ChevronDown className="h-4 w-4 text-white/30" />
              </button>

              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[15px] text-white/40"
                aria-label="Indicators (coming soon)"
                title="Coming soon"
              >
                <ScanSearch className="h-4 w-4" />
                Indicators
                <ChevronDown className="h-4 w-4 text-white/30" />
              </button>
            </div>

            <div className="relative px-3 py-2">
              {loading ? (
                <div className="flex h-[334px] items-center justify-center text-sm text-white/45">
                  Loading chart...
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-[334px] flex-col items-center justify-center gap-2 text-sm text-white/45">
                  <BarChart3 className="h-6 w-6 text-white/20" />
                  Insufficient data for chart
                </div>
              ) : (
                <>
                  <TradingChart
                    data={chartData}
                    variant={chartVariant}
                    referencePrice={research?.previousClose ?? null}
                    onHoverPrice={(price, time) => {
                      setHoveredPrice(price);
                      setHoveredTime(time);
                    }}
                  />
                  <div className="pointer-events-none absolute right-8 bottom-[86px] text-right text-[13px] text-white/74">
                    <div>Prev. close {formatCurrency(research?.previousClose)}</div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3 px-5 py-3">
              {RANGE_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveRange(tab)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-[14px] text-white/62 transition",
                    activeRange === tab && "bg-white/[0.08] text-white",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-8 border-b border-white/10 px-2">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveContentTab(tab)}
                className={cn(
                  "relative pb-4 text-[16px] text-white/70 transition",
                  activeContentTab === tab && "text-white",
                )}
              >
                {tab}
                {activeContentTab === tab && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-[#a8c7fa]" />
                )}
              </button>
            ))}
          </div>

          <div className="border-b border-white/10 px-2 py-6">
            <div className="flex items-center gap-3 text-[15px] text-white/88">
              <Sparkles className="h-5 w-5 text-white/88" />
              <p className="truncate">
                {research?.summary ??
                  "Research summary is loading for the selected symbol."}
              </p>
              <button type="button" className="ml-auto rounded-full bg-white/[0.06] p-2">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {activeContentTab === "Overview" && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 pt-4 xl:grid-cols-3">
              <StatsColumn
                items={[
                  ["Open", formatCurrency(research?.open)],
                  ["High", formatCurrency(research?.dayHigh)],
                  ["Low", formatCurrency(research?.dayLow)],
                  ["Prev. close", formatCurrency(research?.previousClose)],
                ]}
              />
              <StatsColumn
                items={[
                  ["Volume", formatCompactNumber(research?.volume)],
                  ["Support", formatCurrency(research?.support)],
                  ["Resistance", formatCurrency(research?.resistance)],
                  ["Volatility", formatNumber(research?.volatility)],
                ]}
              />
              <StatsColumn
                items={[
                  ["52-wk high", formatCurrency(research?.yearHigh)],
                  ["52-wk low", formatCurrency(research?.yearLow)],
                  ["Momentum", formatPercent(research?.momentum)],
                  ["Sector", research?.sector ?? "--"],
                ]}
              />
            </div>
          )}

          {activeContentTab === "Earnings" && (
            <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-2">
              <InsightCard title="Bullish Factors" items={research?.bullishPoints ?? []} />
              <InsightCard title="Risk Factors" items={research?.riskPoints ?? []} />
            </div>
          )}

          {activeContentTab === "Financials" && (
            <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-2">
              <StatsColumn
                items={[
                  ["Exchange", research?.exchange ?? "--"],
                  ["Symbol", research?.symbol ?? "--"],
                  ["Peers", String(research?.peers.length ?? 0)],
                  ["Stance", research?.stance ?? "--"],
                ]}
              />
              <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <p className="text-sm font-medium text-white">Related peers</p>
                <div className="flex flex-wrap gap-2">
                  {(research?.peers ?? []).map((peer) => (
                    <Link
                      key={peer}
                      href={`/dashboard/symbol/${peer}`}
                      className="rounded-full bg-white/[0.06] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.1]"
                    >
                      {peer}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <p className="pt-4 text-sm text-red-400">{error}</p>}
          {streamError && <p className="pt-2 text-sm text-amber-300">{streamError}</p>}
        </section>

      </div>
    </main>
  );
}

function getRangeInterval(range: (typeof RANGE_TABS)[number]): string {
  switch (range) {
    case "1D": return "1m";
    case "5D": return "5m";
    case "1M": return "30m";
    case "6M": return "1d";
    case "YTD": return "1d";
    case "1Y": return "1d";
    case "5Y": return "1wk";
    case "MAX": return "1mo";
    default:   return "5m";
  }
}

function isIndexSymbol(symbol: string) {
  return INDEX_SYMBOLS.has(symbol.toUpperCase());
}

function StatsColumn({ items }: { items: [string, string][] }) {
  return (
    <div className="divide-y divide-white/8">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 py-3">
          <span className="text-[14px] text-white/56">{label}</span>
          <span className="text-[15px] text-white/92">{value}</span>
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") {
    return "₹--";
  }

  return `₹${value.toFixed(2)}`;
}

function formatSignedCurrency(value?: number) {
  if (typeof value !== "number") {
    return "₹--";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatSignedPercent(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatCompact(value: number) {
  return value.toFixed(2);
}

function formatCompactNumber(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return value.toFixed(2);
}

function formatPercent(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatResearchTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

function InsightCard({
  title,
  items,
}: {
  title: string;
  items: { title: string; detail: string }[];
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <p className="text-sm font-medium text-white">{title}</p>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.title}>
            <p className="text-sm font-medium text-white/92">{item.title}</p>
            <p className="mt-1 text-sm leading-7 text-white/62">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function intervalToBucketMs(interval: string) {
  switch (interval) {
    case "1m":
      return 60_000;
    case "5m":
      return 5 * 60_000;
    case "30m":
      return 30 * 60_000;
    default:
      return 60_000;
  }
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
