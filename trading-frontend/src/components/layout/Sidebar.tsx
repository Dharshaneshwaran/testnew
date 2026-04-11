"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Expand, ListPlus, Plus } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { getEquityQuote, getSectors, getTimeSeries } from "@/lib/api/market";
import { getWatchlistFolders } from "@/lib/api/watchlist";
import type { PricePoint, SectorCard } from "@/types/market";
import type { WatchlistFolderType } from "@/types/watchlist";

type LiveSectorRow = {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
  sparkline: PricePoint[];
};

export function Sidebar() {
  const { token } = useAuth();
  const [watchlistFolders, setWatchlistFolders] = useState<WatchlistFolderType[]>([]);
  const [sectorRows, setSectorRows] = useState<LiveSectorRow[]>([]);

  useEffect(() => {
    let active = true;

    async function loadWatchlists() {
      if (!token) {
        if (active) {
          setWatchlistFolders([]);
        }
        return;
      }

      try {
        const folders = await getWatchlistFolders(token);
        if (active) {
          setWatchlistFolders(folders);
        }
      } catch {
        if (active) {
          setWatchlistFolders([]);
        }
      }
    }

    void loadWatchlists();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadSectors() {
      try {
        const sectors = await getSectors();
        const nextRows = await Promise.all(
          sectors.slice(0, 5).map((sector) => hydrateSectorRow(sector)),
        );

        if (active) {
          setSectorRows(nextRows.filter((row): row is LiveSectorRow => row !== null));
        }
      } catch {
        if (active) {
          setSectorRows([]);
        }
      }
    }

    void loadSectors();

    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="hidden w-[360px] shrink-0 border-r border-white/8 bg-[#0d0f14] px-6 py-5 lg:block">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[21px] font-medium tracking-[-0.03em] text-white">Lists</h2>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#6eb9ff] text-white/90"
            aria-label="Open lists"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-white/72">
          <button type="button" aria-label="New list">
            <ListPlus className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Expand">
            <Expand className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 h-px bg-white/10" />

      <section className="pt-7">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-medium text-white">Watchlist</h3>
          <div className="flex items-center gap-4 text-white/72">
            <button type="button" aria-label="Add to watchlist">
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Collapse watchlist">
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {watchlistFolders.length === 0 ? (
          <p className="mt-4 text-[15px] text-white/50">This list is empty</p>
        ) : (
          <div className="mt-4 space-y-5">
            {watchlistFolders.slice(0, 2).map((folder) => (
              <div key={folder.id}>
                <p className="text-[14px] font-medium text-white/92">{folder.name}</p>
                <div className="mt-3 space-y-3">
                  {folder.items.slice(0, 4).map((item) => (
                    <Link
                      key={`${folder.id}-${item.symbol}`}
                      href={`/dashboard/symbol/${item.symbol}`}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <div>
                        <p className="text-white">{item.symbol}</p>
                        <p className="mt-0.5 text-white/45">{item.exchange}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{formatPrice(item.ltp)}</p>
                        <p className={item.changePercent >= 0 ? "text-[#8ee78f]" : "text-[#f28b82]"}>
                          {item.changePercent >= 0 ? "+" : ""}
                          {item.changePercent.toFixed(2)}%
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pt-10">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-medium text-white">Equity sectors</h3>
          <button type="button" aria-label="Collapse equity sectors" className="text-white/72">
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-white/8">
          {sectorRows.map((sector) => (
            <div key={sector.symbol} className="grid grid-cols-[1fr_92px_auto] items-center gap-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium tracking-[0.01em] text-white">
                  {sector.symbol}
                </p>
                <p className="mt-1 text-sm text-white/52">{sector.label}</p>
              </div>
              <div className="h-9">
                <MiniSparkline points={sector.sparkline} trend={sector.changePercent >= 0 ? "up" : "down"} />
              </div>
              <div className="text-right">
                <p className="text-[15px] font-medium text-white">{formatPrice(sector.price)}</p>
                <p className={sector.changePercent >= 0 ? "mt-1 text-sm text-[#8ee78f]" : "mt-1 text-sm text-[#f28b82]"}>
                  {sector.changePercent >= 0 ? "+" : ""}
                  {sector.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
          {sectorRows.length === 0 && (
            <p className="py-4 text-sm text-white/45">Loading sectors...</p>
          )}
        </div>
      </section>
    </aside>
  );
}

async function hydrateSectorRow(sector: SectorCard): Promise<LiveSectorRow | null> {
  const symbol = sector.leaders?.[0];
  if (!symbol) {
    return null;
  }

  try {
    const [quote, sparkline] = await Promise.all([
      getEquityQuote(symbol),
      getTimeSeries("equity", symbol, { range: "1d", interval: "30m" }),
    ]);

    return {
      symbol,
      label: sector.name,
      price: quote.price,
      changePercent: quote.changePercent,
      sparkline,
    };
  } catch {
    return null;
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
