import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { WatchlistItemType } from "@/types/watchlist";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { cn } from "@/lib/utils";

export function WatchlistItem({ item }: { item: WatchlistItemType }) {
  const isUp = item.change >= 0;

  return (
    <Link
      href={`/dashboard/symbol/${item.symbol}`}
      className="group block px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/[0.08] hover:border hover:border-white/[0.1]"
    >
      <div className="flex items-center gap-3">
        <div className="w-16 flex-shrink-0">
          <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">{item.symbol}</p>
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

        <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
      </div>
    </Link>
  );
}
