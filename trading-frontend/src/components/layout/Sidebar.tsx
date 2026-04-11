"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Expand, ListPlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { WatchlistFolder } from "@/components/watchlist/WatchlistFolder";

import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboard } from "@/context/DashboardContext";
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
  const { mode } = useDashboard();
  const [watchlistFolders, setWatchlistFolders] = useState<WatchlistFolderType[]>([]);
  const [sectorRows, setSectorRows] = useState<LiveSectorRow[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectorsLoaded, setSectorsLoaded] = useState(false);

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

    const handleUpdate = () => {
      void loadWatchlists();
    };
    
    const handleToggle = () => {
      setMobileOpen(prev => !prev);
    };

    window.addEventListener("watchlist-updated", handleUpdate);
    window.addEventListener("toggle-sidebar", handleToggle);

    return () => {
      active = false;
      window.removeEventListener("watchlist-updated", handleUpdate);
      window.removeEventListener("toggle-sidebar", handleToggle);
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
          setSectorsLoaded(true);
        }
      } catch {
        if (active) {
          setSectorRows([]);
        }
      } finally {
        if (active) setSectorsLoaded(true);
      }
    }

    void loadSectors();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[300px] sm:w-[360px] shrink-0 border-r border-white/8 bg-[#0d0f14] px-6 py-8 overflow-y-auto transition-transform duration-300 lg:static lg:block lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-12 flex items-center justify-between">
          <h1 className="text-[24px] font-semibold tracking-[-0.04em] text-white">
            Ruroxz <span className="font-normal text-white/70">Finance</span>
          </h1>
          <button 
            type="button" 
            className="lg:hidden text-white/70"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        {mode === "classic" ? (
          <section className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 group cursor-pointer">
                <h2 className="text-[21px] font-medium tracking-[-0.03em] text-white group-hover:text-white/90">Watchlist</h2>
                <ChevronDown className="h-4 w-4 text-white/50 group-hover:text-white/70" />
              </div>
              <button type="button" aria-label="Add" className="hover:text-white transition-colors">
                <Plus className="h-5 w-5 text-white/72" />
              </button>
            </div>

            <div className="space-y-1">
              {watchlistFolders.length === 0 ? (
                <p className="px-4 py-2 text-[15px] text-white/50 italic">No watchlists. Create one to get started!</p>
              ) : (
                watchlistFolders.map((folder) => (
                  <WatchlistFolder key={folder.id} folder={folder} />
                ))
              )}
            </div>

            <p className="px-3 text-[11px] text-white/30 uppercase tracking-widest font-semibold pt-4">
              Hold & Drag to Dashboard
            </p>
          </section>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 group cursor-pointer">
                <h2 className="text-[21px] font-medium tracking-[-0.03em] text-white group-hover:text-white/90">Lists</h2>
                <ChevronDown className="h-4 w-4 text-white/50 group-hover:text-white/70" />
              </div>
              <div className="flex items-center gap-4 text-white/72">
                <button type="button" aria-label="New list" className="hover:text-white transition-colors">
                  <ListPlus className="h-5 w-5" />
                </button>
                <button type="button" aria-label="Expand" className="hover:text-white transition-colors">
                  <Expand className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 h-px bg-white/10" />

            <section className="pt-7">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-[17px] font-medium text-white">Watchlist</h3>
                <div className="flex items-center gap-4 text-white/72">
                  <button type="button" aria-label="Add to watchlist" className="hover:text-white transition-colors">
                    <Plus className="h-5 w-5" />
                  </button>
                  <button type="button" aria-label="Collapse watchlist" className="hover:text-white transition-colors">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {watchlistFolders.length === 0 ? (
                  <p className="px-4 py-2 text-[15px] text-white/50 italic">This list is empty</p>
                ) : (
                  watchlistFolders.map((folder) => (
                    <WatchlistFolder key={folder.id} folder={folder} />
                  ))
                )}
              </div>
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
              </div>
            </section>
          </>
        )}
    </aside>
    </>
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
