import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, X, GripVertical } from "lucide-react";
import { WatchlistItemType } from "@/types/watchlist";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useDashboard } from "@/context/DashboardContext";
import { StockMoveAlertButton } from "@/components/watchlist/StockMoveAlertButton";

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
      {...(mode === "classic" ? listeners : {})}
      {...(mode === "classic" ? attributes : {})}
      className={cn(
        "group flex w-full min-w-0 items-center gap-1.5",
        mode === "classic" && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-blue-500/50 rounded-lg"
      )}
    >
      {mode === "classic" && (
        <div 
          className="flex-shrink-0 p-1 text-white/30 hover:text-white/60"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <Link
        href={`/dashboard/symbol/${item.symbol}`}
        onClick={(e) => {
          // Prevent navigation during drag
          if (isDragging) {
            e.preventDefault();
          }
        }}
        className={cn(
          "flex-1 block min-w-0 rounded-xl px-2.5 py-2 transition-colors",
          !isDragging && "cursor-pointer hover:bg-white/[0.06]",
          isDragging && "pointer-events-none"
        )}
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-[0.01em] text-zinc-100 group-hover:text-white">
              {item.symbol}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-white/40">{item.exchange}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[13px] font-semibold tabular-nums text-zinc-100">
              {item.ltp.toFixed(2)}
            </p>
            <div
              className={cn(
                "mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-semibold tabular-nums",
                isUp ? "text-[#8ee78f]" : "text-[#f28b82]",
              )}
            >
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{isUp ? "+" : ""}{item.changePercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex-shrink-0">
        <StockMoveAlertButton
          symbol={item.symbol}
          className="h-7 w-7 opacity-70 hover:opacity-100"
        />
      </div>
      
      {onRemove && (
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 disabled:opacity-50"
          title="Remove from watchlist"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
