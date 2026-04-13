"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Expand, ListPlus, Plus } from "lucide-react";
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
  const { mode, sidebarCollapsed, setSidebarCollapsed } = useDashboard();
  const [watchlistFolders, setWatchlistFolders] = useState<WatchlistFolderType[]>([]);
  const [sectorRows, setSectorRows] = useState<LiveSectorRow[]>([]);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(true);
  const [sectorsOpen, setSectorsOpen] = useState(true);

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
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={cn(
        "no-scrollbar fixed inset-y-0 left-0 z-50 shrink-0 border-r border-white/8 bg-[#0d0f14] py-8 overflow-y-auto overflow-x-hidden transition-all duration-300 lg:static lg:block lg:translate-x-0",
        sidebarCollapsed ? "w-[76px] px-3" : "w-full max-w-[360px] px-6 sm:w-[360px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-12 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <h1 className="text-[24px] font-semibold tracking-[-0.04em] text-white">
              Ruroxz <span className="font-normal text-white/70">Finance</span>
            </h1>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-sm font-semibold text-white/70">
              RF
            </div>
          )}
          <button 
            type="button" 
            className="lg:hidden text-white/70"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="hidden lg:flex justify-end mb-6">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {sidebarCollapsed ? null : (
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
                <button
                  type="button"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="hover:text-white transition-colors"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
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
                <button
                  type="button"
                  aria-label={watchlistOpen ? "Collapse watchlist" : "Expand watchlist"}
                  className="text-white/72 hover:text-white transition-colors"
                  onClick={() => setWatchlistOpen((prev) => !prev)}
                >
                  <ChevronUp className={cn("h-4 w-4 transition-transform", !watchlistOpen && "rotate-180")} />
                </button>
              </div>

              {watchlistOpen && (
                <div className="space-y-1">
                  {watchlistFolders.length === 0 ? (
                    <p className="px-4 py-2 text-[15px] text-white/50 italic">No lists yet</p>
                  ) : (
                    watchlistFolders.map((folder) => (
                      <WatchlistFolder key={folder.id} folder={folder} allFolders={watchlistFolders} />
                    ))
                  )}
                </div>
              )}

              {mode === "classic" && (
                <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/30">
                  Hold & Drag to Dashboard
                </p>
              )}
            </section>

            <section className="pt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-medium text-white">Equity sectors</h3>
                <button
                  type="button"
                  aria-label={sectorsOpen ? "Collapse equity sectors" : "Expand equity sectors"}
                  className="text-white/72 hover:text-white transition-colors"
                  onClick={() => setSectorsOpen((prev) => !prev)}
                >
                  <ChevronUp className={cn("h-4 w-4 transition-transform", !sectorsOpen && "rotate-180")} />
                </button>
              </div>

              {sectorsOpen && (
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
              )}
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
