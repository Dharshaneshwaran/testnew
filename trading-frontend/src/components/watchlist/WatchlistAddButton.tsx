"use client";

import { Plus, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { addWatchlistItem, getWatchlistFolders, createWatchlistFolder } from "@/lib/api/watchlist";
import { cn } from "@/lib/utils";

interface WatchlistAddButtonProps {
  symbol: string;
  exchange?: string;
  className?: string;
}

export function WatchlistAddButton({ symbol, exchange, className }: WatchlistAddButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { token } = useAuth();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
        alert("Please login to add to watchlist");
        return;
    }

    setLoading(true);
    try {
      const folders = await getWatchlistFolders(token);
      let targetFolderId = folders[0]?.id;

      if (!targetFolderId) {
        // Create a default folder if none exist
        const defaultFolder = await createWatchlistFolder(token, "My Watchlist");
        targetFolderId = defaultFolder.id;
      }

      await addWatchlistItem(token, targetFolderId, symbol, exchange);
      setAdded(true);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading || added}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
        added 
          ? "bg-emerald-500/20 text-emerald-400" 
          : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white",
        className
      )}
      title="Add to watchlist"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : added ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </button>
  );
}
