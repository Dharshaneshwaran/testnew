"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Expand, ListPlus, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { WatchlistFolder } from "@/components/watchlist/WatchlistFolder";

import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboard } from "@/context/DashboardContext";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { getEquityQuote, getSectors, getTimeSeries } from "@/lib/api/market";
import { getWatchlistFolders } from "@/lib/api/watchlist";
import type { PricePoint, SectorCard } from "@/types/market";
import type { WatchlistFolderType } from "@/types/watchlist";
import { useDraggable } from "@dnd-kit/core";

type LiveSectorRow = {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
  sparkline: PricePoint[];
};

function DraggableStockItem({ symbol, onRemove }: { symbol: string; onRemove: (s: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `classic-${symbol}`,
    data: { symbol },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]",
        isDragging && "opacity-50 ring-2 ring-blue-500/50"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div {...listeners} {...attributes} className="cursor-grab p-1 text-white/30 hover:text-white/60">
          <GripVertical className="h-4 w-4" />
        </div>
        <span className="font-medium text-white">{symbol}</span>
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={() => onRemove(symbol)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Sidebar() {
  const { token } = useAuth();
  const { mode, sidebarStocks, addSidebarStock, removeSidebarStock } = useDashboard();
  const [watchlistFolders, setWatchlistFolders] = useState<WatchlistFolderType[]>([]);
  const [sectorRows, setSectorRows] = useState<LiveSectorRow[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectorsLoaded, setSectorsLoaded] = useState(false);
  const [newStock, setNewStock] = useState("");

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
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[17px] font-medium text-white">Desired Stocks</h3>
              <Plus className="h-4 w-4 text-white/40" />
            </div>

            <div className="px-2">
              <div className="relative group/input">
                <input
                  type="text"
                  placeholder="Add stock (e.g. BTC)..."
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addSidebarStock(newStock);
                      setNewStock("");
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-white/20 transition-all focus:border-blue-500/50 focus:bg-white/[0.05] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    addSidebarStock(newStock);
                    setNewStock("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 px-2 max-h-[calc(100vh-320px)] overflow-y-auto no-scrollbar">
              {sidebarStocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                  <p className="text-sm text-white/40 italic">Your list is empty. Add some stocks above!</p>
                </div>
              ) : (
                sidebarStocks.map((symbol) => (
                  <DraggableStockItem 
                    key={symbol} 
                    symbol={symbol} 
                    onRemove={removeSidebarStock}
                  />
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
