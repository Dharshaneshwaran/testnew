import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WatchlistAddButton } from "@/components/watchlist/WatchlistAddButton";
import { PricePoint, Ticker } from "@/types/market";

export function PriceTicker({ ticker, sparkline }: { ticker: Ticker; sparkline: PricePoint[] }) {
  const isUp = ticker.change >= 0;

  return (
    <Card className="transition duration-200 hover:-translate-y-0.5 hover:border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs text-zinc-400">{ticker.name}</CardTitle>
          <WatchlistAddButton symbol={ticker.symbol} className="h-6 w-6" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-zinc-100">{ticker.symbol}</p>
          <p className="text-base font-semibold text-zinc-100">{ticker.price.toFixed(2)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-[52px]">
          <MiniSparkline points={sparkline} trend={isUp ? "up" : "down"} />
        </div>
        <p className={`flex items-center gap-1 text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {ticker.change >= 0 ? "+" : ""}
          {ticker.change.toFixed(2)} ({ticker.changePercent.toFixed(2)}%)
        </p>
      </CardContent>
    </Card>
  );
}
