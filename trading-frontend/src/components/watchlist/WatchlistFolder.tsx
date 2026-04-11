"use client";

import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
import { useState, useCallback, useRef } from "react";

import { WatchlistItem } from "@/components/watchlist/WatchlistItem";
import { WatchlistFolderType } from "@/types/watchlist";
import { cn } from "@/lib/utils";
import { searchMarket } from "@/lib/api/market";
import { addWatchlistItem, deleteWatchlistItem } from "@/lib/api/watchlist";
import { useAuth } from "@/components/auth/AuthProvider";

export function WatchlistFolder({ folder }: { folder: WatchlistFolderType }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const DEFAULT_SUGGESTIONS = [
    { hint: "NIFTY 50", label: "NSE", route: "/index/nifty", keywords: ["NIFTY"] },
    { hint: "SENSEX", label: "BSE", route: "/index/sensex", keywords: ["SENSEX"] },
    { hint: "RELIANCE", label: "NSE", route: "/stock/reliance", keywords: ["Reliance Industries"] },
    { hint: "TCS", label: "NSE", route: "/stock/tcs", keywords: ["Tata Consultancy Services"] },
    { hint: "HDFCBANK", label: "NSE", route: "/stock/hdfcbank", keywords: ["HDFC Bank"] },
  ];

  const performSearch = async (query: string) => {
    if (!query) {
      setResults(DEFAULT_SUGGESTIONS);
      return;
    }
    setIsLoading(true);
    try {
      const searchResults = await searchMarket(query);
      setResults(searchResults.slice(0, 5));
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEdit = () => {
    const nextEditing = !isEditing;
    setIsEditing(nextEditing);
    if (nextEditing) {
      setOpen(true);
      setResults(DEFAULT_SUGGESTIONS);
    } else {
      setSearchQuery("");
      setResults([]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleAdd = async (symbol: string) => {
    if (!token) return;
    if (folder.items.some((item) => item.symbol === symbol)) {
      alert("This symbol is already in the watchlist.");
      return;
    }
    try {
      await addWatchlistItem(token, folder.id, symbol, "NSE");
      setSearchQuery("");
      setResults([]);
      setIsEditing(false);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (err) {
      console.error("Add failed", err);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!token) return;
    try {
      await deleteWatchlistItem(token, itemId);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (err) {
      console.error("Remove failed", err);
      throw err;
    }
  };

  return (
    <div className="border-t border-white/5 py-1 first:border-t-0">
      <div className="group flex items-center justify-between px-2 py-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex flex-1 items-center gap-2 text-left text-base font-medium text-zinc-100 transition-colors hover:text-white"
        >
          <span className="capitalize">{folder.name}</span>
        </button>
        
        <div className="flex items-center gap-1">
          {isEditing ? (
            <button
              onClick={handleToggleEdit}
              className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors px-3 py-1"
            >
              Done
            </button>
          ) : (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={handleToggleEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                title="Add to this list"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="pb-2">
          {isEditing && (
            <div className="px-3 mb-4">
              <div className="relative flex items-center bg-zinc-800/40 rounded-xl border border-white/10 px-4 py-2.5 focus-within:bg-zinc-800/60 focus-within:border-blue-500/50 transition-all shadow-sm">
                <Search className="h-5 w-5 text-blue-500 mr-3" />
                <input
                  type="text"
                  placeholder="Add symbols"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="bg-transparent border-none outline-none text-sm text-zinc-100 w-full placeholder:text-zinc-500"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setResults(DEFAULT_SUGGESTIONS); }} className="ml-2 text-zinc-500 hover:text-zinc-300">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <div className="mt-3 bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider border-b border-white/5 bg-white/[0.02]">
                    {searchQuery ? "Search Results" : "Popular on Google"}
                  </div>
                  {results.map((result) => (
                    <div key={result.route} className="flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 group/item">
                      <button
                        onClick={() => handleAdd(result.hint)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-blue-500 hover:bg-blue-500/20 active:scale-95 transition"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[15px] font-semibold text-zinc-100 tracking-tight">{result.hint}</span>
                          <span className="text-[11px] text-zinc-500 uppercase font-medium">{result.label}</span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{result.keywords[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-0.5">
            {folder.items.length === 0 ? (
              !isEditing && <p className="px-4 py-2 text-sm text-zinc-500 italic">This list is empty</p>
            ) : (
              folder.items
                .filter((item, index, self) => 
                  index === self.findIndex((t) => t.symbol === item.symbol)
                )
                .map((item) => (
                  <WatchlistItem 
                    key={`${folder.id}-${item.id}`} 
                    item={item}
                    onRemove={handleRemove}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
