"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Menu,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboard } from "@/context/DashboardContext";
import { cn } from "@/lib/utils";
import {
  getIndexQuotes,
  searchMarket,
  toTicker,
  type MarketSearchItem,
} from "@/lib/api/market";
import type { Ticker } from "@/types/market";

const INDEX_CONFIG = [
  { symbol: "NIFTY", name: "NIFTY 50" },
  { symbol: "SENSEX", name: "SENSEX" },
  { symbol: "BANKNIFTY", name: "Nifty Bank" },
] as const;

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { mode, setMode, marketBarVisible, setMarketBarVisible } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MarketSearchItem[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = searchQuery.trim();

  useEffect(() => {
    let active = true;

    async function loadTickers() {
      try {
        const quotes = await getIndexQuotes(INDEX_CONFIG.map((item) => item.symbol));
        if (!active) {
          return;
        }

        setTickers(quotes.map((quote, index) => toTicker(quote, INDEX_CONFIG[index].name)));
      } catch {
        if (active) {
          setTickers([]);
        }
      }
    }

    void loadTickers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!normalizedQuery) return;

    let active = true;
    const timeoutId = setTimeout(() => {
      void searchMarket(normalizedQuery)
        .then((items) => {
          if (active) setSuggestions(items);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [normalizedQuery]);

  const userInitials = useMemo(() => {
    const source = user?.name?.trim() || user?.email?.trim() || "T";
    return source.slice(0, 1).toUpperCase();
  }, [user?.email, user?.name]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const route = suggestions[0]?.route;
    if (!route) {
      setSearchError("Enter a symbol or section name.");
      return;
    }

    setSearchError(null);
    setSearchQuery("");
    setSuggestions([]);

    startTransition(() => {
      if (route !== pathname) {
        router.push(route);
      }
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d12]/95 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-2 lg:px-4">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden h-9 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-sm text-white/90 inline-flex"
              onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
            >
              <Menu className="h-4 w-4 text-white/70" />
            </button>
            <button
              type="button"
              className="hidden h-9 items-center gap-2 rounded-full bg-white/[0.06] px-5 text-sm text-white/90 lg:inline-flex"
            >
              India
              <ChevronDown className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {marketBarVisible ? (
            <div className="hidden min-w-0 flex-1 items-center gap-3 overflow-hidden py-1 xl:flex">
              <div className="min-w-0 flex-1 flex-wrap items-center gap-3 overflow-hidden xl:flex">
                {tickers.map((ticker) => (
                  <div key={ticker.symbol} className="flex-shrink-0">
                    <MarketChip ticker={ticker} />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                onClick={() => setMarketBarVisible(false)}
                aria-label="Hide market bar"
                title="Hide market bar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="hidden h-9 items-center gap-2 rounded-full bg-white/[0.06] px-4 text-sm text-white/85 transition hover:bg-white/[0.09] xl:inline-flex"
              onClick={() => setMarketBarVisible(true)}
              aria-label="Show market bar"
              title="Show market bar"
            >
              <BarChart3 className="h-4 w-4 text-white/70" />
              Markets
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/80 transition hover:bg-white/[0.06] lg:inline-flex"
              onClick={() => router.push("/dashboard/chat")}
              aria-label="Open chat"
              title="Chat"
            >
              <MessageSquare className="h-4 w-4 text-white/70" />
              Chat
            </button>

            <form className="relative flex-1 md:flex-none md:block" onSubmit={handleSearch}>
              <label className="flex h-10 w-[220px] items-center rounded-full border border-white/8 bg-white/[0.03] pl-4 pr-3 text-sm text-white/80 transition focus-within:border-white/18">
                <Search className="h-4 w-4 text-white/55" />
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchQuery(value);
                    if (!value.trim()) {
                      setSearchError(null);
                      setSuggestions([]);
                    }
                  }}
                  placeholder="Search"
                  aria-label="Search"
                  className="w-full bg-transparent px-3 outline-none placeholder:text-white/35"
                />
              </label>
              {normalizedQuery.length > 0 && suggestions.length > 0 && (
                <div className="absolute right-0 left-0 top-full mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#13151d] shadow-2xl">
                  {suggestions.map((item) => (
                    <button
                      key={`${item.label}-${item.route}`}
                      type="button"
                      onClick={() => {
                        setSearchError(null);
                        setSearchQuery("");
                        setSuggestions([]);
                        startTransition(() => {
                          if (item.route !== pathname) {
                            router.push(item.route);
                          }
                        });
                      }}
                      className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.04] last:border-b-0"
                    >
                      <div>
                        <span className="text-sm font-semibold text-zinc-100">{item.label}</span>
                        {item.hint && item.hint !== item.label ? (
                          <p className="text-[11px] text-zinc-500 mt-0.5">{item.hint}</p>
                        ) : (
                          <p className="text-[11px] text-zinc-500 mt-0.5">NSE Index</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchError && <p className="mt-1 text-xs text-red-400">{searchError}</p>}
            </form>

            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/[0.05] lg:inline-flex"
              aria-label={`Open ${title}`}
              title={subtitle}
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="hidden h-7 w-px bg-white/12 lg:block" />

            <div className="hidden items-center rounded-full border border-white/10 bg-white/[0.02] p-1 lg:flex">
              <button 
                type="button" 
                onClick={() => setMode("classic")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  mode === "classic" ? "bg-[#1a1d27] text-[#8ee78f]" : "text-white/75"
                )}
              >
                Classic
              </button>
              <button
                type="button"
                onClick={() => setMode("beta")}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors",
                  mode === "beta" ? "bg-[#1a1d27] text-[#8ee78f]" : "text-white/75"
                )}
              >
                {mode === "beta" && <Check className="h-4 w-4" />}
                Beta
              </button>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_30%,#56d36c,#16381c)] text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              aria-label="Profile"
            >
              {userInitials}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function MarketChip({ ticker }: { ticker: Ticker }) {
  const isPositive = ticker.change >= 0;

  return (
    <div className="flex items-center gap-3 rounded-full bg-white/[0.05] px-4 py-2">
      <span className="whitespace-nowrap text-[13px] font-semibold text-white/92">{ticker.name}</span>
      <span className="whitespace-nowrap text-[13px] text-zinc-500 font-medium">{ticker.price.toFixed(2)}</span>
      <span
        className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isPositive ? "text-[#8ee78f]" : "text-[#f28b82]",
        )}
      >
        {isPositive ? "+" : ""}
        {ticker.changePercent.toFixed(2)}%
        <span
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
            isPositive ? "bg-[#8ee78f] text-[#0f1611]" : "bg-[#f28b82] text-[#2a1313]",
          )}
        >
          {isPositive ? "↑" : "↓"}
        </span>
      </span>
    </div>
  );
}
