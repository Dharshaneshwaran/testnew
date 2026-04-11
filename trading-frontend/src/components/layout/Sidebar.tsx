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
import { createWatchlistFolder, getWatchlistFolders, deleteAllWatchlistFolders } from "@/lib/api/watchlist";
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
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectorsLoaded, setSectorsLoaded] = useState(false);

  const refreshWatchlists = async () => {
    if (!token) return;
    try {
      const folders = await getWatchlistFolders(token);
      setWatchlistFolders(folders);
    } catch (err) {
      console.error("Failed to refresh watchlists", err);
    }
  };

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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;
    try {
      await createWatchlistFolder(token, newFolderName);
      setNewFolderName("");
      setIsAddingFolder(false);
      await refreshWatchlists();
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const handleDeleteAllFolders = async () => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete all lists? This cannot be undone.")) return;
    try {
      await deleteAllWatchlistFolders(token);
      await refreshWatchlists();
    } catch (err) {
      console.error("Failed to delete all folders", err);
    }
  };

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
              <button
                type="button"
                aria-label="Add"
                className="hover:text-white transition-colors"
                onClick={() => setIsAddingFolder((prev) => !prev)}
              >
                <Plus className="h-5 w-5 text-white/72" />
              </button>
            </div>

            {isAddingFolder && (
              <form onSubmit={handleCreateFolder} className="px-2">
                <div className="relative flex items-center bg-zinc-800/40 rounded-xl border border-white/10 px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                  <Plus className="h-4 w-4 text-zinc-500 mr-2" />
                  <input
                    type="text"
                    placeholder="List name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-zinc-100 w-full placeholder:text-zinc-500"
                    autoFocus
                  />
                  {newFolderName && (
                    <button type="submit" className="text-xs font-semibold text-blue-500 hover:text-blue-400">
                      Create
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="space-y-1">
              {watchlistFolders.length === 0 ? (
                <p className="px-4 py-2 text-[15px] text-white/50 italic">No watchlists. Create one to get started!</p>
              ) : (
                watchlistFolders.map((folder) => (
                  <WatchlistFolder key={folder.id} folder={folder} allFolders={watchlistFolders} />
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
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1 cursor-pointer group-hover:text-white/90 transition-colors"
                >
                  <h2 className="text-[21px] font-medium tracking-[-0.03em] text-white">Lists</h2>
                  <ChevronDown className="h-4 w-4 text-white/50 group-hover:text-white/70" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
                    Manage lists
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
                    Recently visited
                  </button>
                  <div className="my-1 h-px bg-white/5" />
                  <button
                    onClick={handleDeleteAllFolders}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    Delete all lists
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/72">
                <button
                  type="button"
                  aria-label="New list"
                  className={cn("hover:text-white transition-colors", isAddingFolder && "text-blue-500")}
                  onClick={() => setIsAddingFolder((prev) => !prev)}
                >
                  <ListPlus className="h-5 w-5" />
                </button>
                <button type="button" aria-label="Expand" className="hover:text-white transition-colors">
                  <Expand className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 h-px bg-white/10" />

            {isAddingFolder && (
              <form onSubmit={handleCreateFolder} className="mt-4 px-2">
                <div className="relative flex items-center bg-zinc-800/40 rounded-xl border border-white/10 px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                  <Plus className="h-4 w-4 text-zinc-500 mr-2" />
                  <input
                    type="text"
                    placeholder="List name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-zinc-100 w-full placeholder:text-zinc-500"
                    autoFocus
                  />
                  {newFolderName && (
                    <button type="submit" className="text-xs font-semibold text-blue-500 hover:text-blue-400">
                      Create
                    </button>
                  )}
                </div>
              </form>
            )}

            <section className="pt-7">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-[17px] font-medium text-white">Watchlist</h3>
                <div className="flex items-center gap-4 text-white/72">
                  <button
                    type="button"
                    aria-label="Add to watchlist"
                    className="hover:text-white transition-colors"
                    onClick={() => setIsAddingFolder(true)}
                  >
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
                    <WatchlistFolder key={folder.id} folder={folder} allFolders={watchlistFolders} />
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
