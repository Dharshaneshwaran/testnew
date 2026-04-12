"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { WatchlistFolderType, WatchlistItemType } from "@/types/watchlist";
import { cn } from "@/lib/utils";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSigned(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatNumber(value)}`;
}

function symbolBadge(symbol: string) {
  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed) return "?";
  return trimmed.length <= 4 ? trimmed : trimmed.slice(0, 3);
}

function uniqueBySymbol(items: WatchlistItemType[]) {
  const seen = new Set<string>();
  const unique: WatchlistItemType[] = [];
  for (const item of items) {
    const key = item.symbol.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

export function WatchlistTable({ folders }: { folders: WatchlistFolderType[] }) {
  if (folders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400">
        No watchlist yet. Add a symbol to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {folders.map((folder) => (
        <FolderTable key={folder.id} folder={folder} />
      ))}
    </div>
  );
}

function FolderTable({ folder }: { folder: WatchlistFolderType }) {
  const [open, setOpen] = useState(true);

  const items = useMemo(() => uniqueBySymbol(folder.items), [folder.items]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-100">{folder.name}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">{items.length} symbols</p>
        </div>
        <span className="text-xs text-zinc-500">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10">
          <div className="grid grid-cols-[minmax(0,1fr)_96px_92px_78px] gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Symbol</span>
            <span className="text-right">Last</span>
            <span className="text-right">Chg</span>
            <span className="text-right">Chg%</span>
          </div>

          <div className="divide-y divide-white/8">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/symbol/${item.symbol}`}
                className="grid grid-cols-[minmax(0,1fr)_96px_92px_78px] items-center gap-2 px-4 py-3 transition hover:bg-white/[0.04]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-[11px] font-semibold text-white/80">
                    {symbolBadge(item.symbol)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-100">{item.symbol}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{item.exchange}</p>
                  </div>
                </div>

                <p className="text-right text-sm font-semibold text-zinc-100 tabular-nums">
                  {formatNumber(item.ltp)}
                </p>

                <p
                  className={cn(
                    "text-right text-sm font-semibold tabular-nums",
                    item.change >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {formatSigned(item.change)}
                </p>

                <p
                  className={cn(
                    "text-right text-sm font-semibold tabular-nums",
                    item.changePercent >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {formatSigned(item.changePercent)}%
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

