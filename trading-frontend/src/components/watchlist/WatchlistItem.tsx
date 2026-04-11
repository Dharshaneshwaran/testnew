import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight, X, GripVertical } from "lucide-react";
import { WatchlistItemType } from "@/types/watchlist";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useDashboard } from "@/context/DashboardContext";

export function WatchlistItem({ item, onRemove }: { item: WatchlistItemType; onRemove?: (itemId: string) => void | Promise<void> }) {
  const isUp = item.change >= 0;
  const [isRemoving, setIsRemoving] = useState(false);
  const { mode } = useDashboard();

  const { setNodeRef, isDragging, transform, attributes, listeners } = useDraggable({
    id: `watchlist-${item.symbol}`,
    data: { symbol: item.symbol },
  });

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onRemove) {
      setIsRemoving(true);
      try {
        await onRemove(item.id);
      } catch (err) {
        console.error("Failed to remove item:", err);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2",
        isDragging && "opacity-50 ring-2 ring-blue-500/50 rounded-lg"
      )}
    >
      {mode === "classic" && (
        <div 
          {...listeners}
          {...attributes}
          className="flex-shrink-0 p-1 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <Link
        href={`/dashboard/symbol/${item.symbol}`}
        className="flex-1 block px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/[0.08] hover:border hover:border-white/[0.1]"
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
      
      {onRemove && (
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400 disabled:opacity-50"
          title="Remove from watchlist"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
