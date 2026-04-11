import Link from "next/link";

import { WatchlistItemType } from "@/types/watchlist";

export function WatchlistItem({ item }: { item: WatchlistItemType }) {
  const isUp = item.change >= 0;

  return (
    <Link
      href={`/dashboard/symbol/${item.symbol}`}
      className="block rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 transition hover:border-white/15 hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{item.symbol}</p>
          <p className="text-xs text-zinc-500">{item.exchange}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-zinc-100">{item.ltp.toFixed(2)}</p>
          <p className={`text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}>
            {item.change >= 0 ? "+" : ""}
            {item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>
    </Link>
  );
}
