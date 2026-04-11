import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WatchlistAddButton } from "@/components/watchlist/WatchlistAddButton";

export function MarketCard({
  symbol,
  name,
  ltp,
  changePercent,
}: {
  symbol: string;
  name: string;
  ltp: number;
  changePercent: number;
}) {
  const isUp = changePercent >= 0;

  return (
    <Link href={`/dashboard/symbol/${symbol}`}>
      <Card className="transition duration-200 hover:border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-zinc-100">{symbol}</CardTitle>
            {name && name !== symbol ? (
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">{name}</p>
            ) : null}
          </div>
          <WatchlistAddButton symbol={symbol} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-zinc-100">{ltp.toFixed(2)}</p>
          <p className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
            {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(2)}%
          </p>
        </div>
      </CardContent>
      </Card>
    </Link>
  );
}
