import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { WatchlistItemType } from "@/types/watchlist";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { cn } from "@/lib/utils";

export function WatchlistItem({ item }: { item: WatchlistItemType }) {
  const isUp = item.change >= 0;

  return (
    <Link
      href={`/dashboard/symbol/${item.symbol}`}
      className="block px-2 py-1.5 transition hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-3">
        <div className="w-16 flex-shrink-0">
          <p className="text-sm font-semibold text-zinc-100">{item.symbol}</p>
          <p className="text-[10px] text-zinc-500 truncate">{item.exchange}</p>
        </div>
        
        <div className="flex-1 h-8 min-w-[60px]">
          {item.sparkline && (
            <MiniSparkline 
              points={item.sparkline} 
              trend={isUp ? "up" : "down"} 
            />
          )}
        </div>

        <div className="text-right flex-shrink-0 min-w-[80px]">
          <p className="text-sm font-semibold text-zinc-100">{item.ltp.toFixed(2)}</p>
          <div className={cn(
            "flex items-center justify-end gap-0.5 text-[11px] font-medium",
            isUp ? "text-emerald-400" : "text-red-400"
          )}>
            {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{isUp ? "+" : ""}{item.changePercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
