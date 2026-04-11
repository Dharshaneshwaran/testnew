"use client";

import { X, ChevronDown } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { useDashboard } from "@/context/DashboardContext";
import { cn } from "@/lib/utils";

function DraggableStockItem({ symbol }: { symbol: string }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: symbol,
    data: { symbol }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "px-3 py-2 rounded-lg border border-transparent cursor-grab transition-all duration-200",
        isDragging 
          ? "bg-blue-500/20 border-blue-500/30 opacity-50" 
          : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]"
      )}
    >
      <p className="text-sm font-semibold text-white">{symbol}</p>
    </div>
  );
}

export function ClassicSidebar() {
  const { sidebarStocks, removeSidebarStock, addSidebarStock } = useDashboard();
  const defaultStocks = [
    "RELIANCE",
    "TCS",
    "HDFCBANK",
    "ICICIBANK",
    "INFY",
    "TATAMOTORS",
    "BHARTIARTL",
    "SBIN",
    "ITC",
    "ONGC",
  ];

  const removedStocks = defaultStocks.filter(s => !sidebarStocks.includes(s));

  return (
    <aside className="w-80 bg-white/[0.02] border-r border-white/[0.1] overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-white/[0.1] sticky top-0 bg-white/[0.01]">
        <h3 className="text-sm font-semibold text-white/90">Stock List</h3>
        <p className="text-xs text-white/50 mt-1">Drag stocks to dashboard</p>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {sidebarStocks.length > 0 ? (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/60 px-1">Available Stocks</p>
              {sidebarStocks.map((symbol) => (
                <div key={symbol} className="flex items-center gap-2 group">
                  <div className="flex-1">
                    <DraggableStockItem symbol={symbol} />
                  </div>
                  <button
                    onClick={() => removeSidebarStock(symbol)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400"
                    title={`Remove ${symbol} from list`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {removedStocks.length > 0 && (
              <div className="pt-3 border-t border-white/[0.1] space-y-2">
                <p className="text-xs font-medium text-white/60 px-1">Removed Stocks</p>
                <div className="space-y-2">
                  {removedStocks.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => addSidebarStock(symbol)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 hover:text-white/90 transition-all text-left"
                    >
                      + {symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-white/40">No stocks available</p>
          </div>
        )}
      </div>
    </aside>
  );
}
