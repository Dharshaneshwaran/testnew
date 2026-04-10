"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { WatchlistItem } from "@/components/watchlist/WatchlistItem";
import { WatchlistFolderType } from "@/types/watchlist";

export function WatchlistFolder({ folder }: { folder: WatchlistFolderType }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.03]"
      >
        <span className="font-medium">{folder.name}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-1 space-y-2">
          {folder.items.map((item) => (
            <WatchlistItem key={`${folder.id}-${item.symbol}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
