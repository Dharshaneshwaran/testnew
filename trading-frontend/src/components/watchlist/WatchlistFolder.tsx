import { AlertTriangle, Check, ChevronDown, ChevronRight, Plus, Search, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";

import { WatchlistItem } from "@/components/watchlist/WatchlistItem";
import { WatchlistFolderType } from "@/types/watchlist";
import { cn } from "@/lib/utils";
import { searchMarket, type MarketSearchItem } from "@/lib/api/market";
import { addWatchlistItem, deleteWatchlistFolder, deleteWatchlistItem, removeWatchlistItem } from "@/lib/api/watchlist";
import { useAuth } from "@/components/auth/AuthProvider";

export function WatchlistFolder({ 
  folder, 
  allFolders = [] 
}: { 
  folder: WatchlistFolderType;
  allFolders?: WatchlistFolderType[];
}) {
  const { token } = useAuth();
  const [open, setOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<MarketSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const DEFAULT_SUGGESTIONS = [
    { hint: "NIFTY 50", label: "NSE", route: "/index/nifty", keywords: ["NIFTY"], symbol: "NIFTY" },
    { hint: "SENSEX", label: "BSE", route: "/index/sensex", keywords: ["SENSEX"], symbol: "SENSEX" },
    { hint: "RELIANCE", label: "NSE", route: "/stock/reliance", keywords: ["Reliance Industries"], symbol: "RELIANCE" },
    { hint: "TCS", label: "NSE", route: "/stock/tcs", keywords: ["Tata Consultancy Services"], symbol: "TCS" },
    { hint: "HDFCBANK", label: "NSE", route: "/stock/hdfcbank", keywords: ["HDFC Bank"], symbol: "HDFCBANK" },
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

  const [activeSelector, setActiveSelector] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const normalizeSymbol = (hint: string, resultSymbol?: string) => {
    const symbol = resultSymbol || hint;
    const symbolMap: Record<string, string> = {
      "NIFTY 50": "NIFTY",
      "BSE SENSEX": "SENSEX",
      "NIFTY BANK": "BANKNIFTY",
    };
    return symbolMap[hint] || symbol;
  };

  const isSymbolInFolder = (symbol: string, targetFolderId: string) => {
    const normalizedSymbol = normalizeSymbol(symbol, symbol);
    const targetFolder = allFolders.find((candidate) => candidate.id === targetFolderId);
    return targetFolder?.items.some((item) => item.symbol === normalizedSymbol);
  };

  const handleToggleFolder = async (hint: string, targetFolderId: string, exchange: string = "NSE", resultSymbol?: string) => {
    if (!token) return;
    const symbol = normalizeSymbol(hint, resultSymbol);
    const exists = isSymbolInFolder(symbol, targetFolderId);
    try {
      if (exists) {
        await removeWatchlistItem(token, targetFolderId, symbol);
      } else {
        await addWatchlistItem(token, targetFolderId, symbol, exchange);
      }
      setActiveSelector(null);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const handleAddToThisFolder = async (hint: string, exchange: string = "NSE", resultSymbol?: string) => {
    if (!token) return;
    const symbol = normalizeSymbol(hint, resultSymbol);
    if (isSymbolInFolder(symbol, folder.id)) return;
    try {
      await addWatchlistItem(token, folder.id, symbol, exchange);
      setSearchQuery("");
      setResults([]);
      setIsEditing(false);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (err) {
      console.error("Add failed", err);
    }
  };

  const handleDeleteFolder = async () => {
    if (!token) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!token) return;
    try {
      await deleteWatchlistFolder(token, folder.id);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete watchlist. Please try again.");
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

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
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
            <div className="flex items-center gap-1">
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
                onClick={handleDeleteFolder}
                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition hover:bg-red-500/20 hover:text-red-400 hover:scale-105"
                title="Delete this list"
              >
                <Trash2 className="h-4 w-4" />
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
                  {results.map((result) => {
                    const symbol = normalizeSymbol(result.hint, result.symbol);
                    const inCurrent = isSymbolInFolder(symbol, folder.id);
                    const showSelector = activeSelector === result.hint;

                    return (
                      <div key={result.route} className="relative p-4 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <button
                              onClick={() => setActiveSelector(showSelector ? null : result.hint)}
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                                inCurrent 
                                  ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20" 
                                  : "text-zinc-500 hover:text-blue-500 hover:bg-white/10"
                              )}
                            >
                              {inCurrent ? (
                                <div className="flex items-center -space-x-0.5">
                                  <Check className="h-4 w-4 stroke-[3px]" />
                                  <ChevronDown className="h-3 w-3 opacity-70" />
                                </div>
                              ) : (
                                <Plus className="h-5 w-5" />
                              )}
                            </button>

                            {showSelector && (
                              <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1c24] border border-white/10 rounded-xl shadow-2xl z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1.5">
                                  Add to list
                                </div>
                                {allFolders.map(f => (
                                  <button
                                    key={f.id}
                                    onClick={() => handleToggleFolder(result.hint, f.id, result.label, result.symbol)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-zinc-300"
                                  >
                                    <span className="capitalize">{f.name}</span>
                                    {isSymbolInFolder(symbol, f.id) && <Check className="h-4 w-4 text-blue-500" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0" onClick={() => !inCurrent && handleAddToThisFolder(result.hint, result.label, result.symbol)}>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[15px] font-semibold text-zinc-100 tracking-tight">{result.hint}</span>
                              <span className="text-[11px] text-zinc-500 uppercase font-medium">{result.label}</span>
                            </div>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{result.keywords[0]}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Custom Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Delete Watchlist</h3>
                  <p className="text-sm text-zinc-500">Are you sure you want to delete this watchlist?</p>
                </div>
              </div>
              
              <p className="text-sm text-zinc-400 mb-6">
                <span className="font-medium text-zinc-300">{folder.name}</span> will be permanently deleted. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 border border-white/10 hover:border-white/20 rounded-lg transition-colors bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-500/30 rounded-lg transition-colors shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
