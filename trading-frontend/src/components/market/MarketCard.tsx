import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="transition duration-200 hover:border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-200">{symbol}</CardTitle>
        <p className="text-xs text-zinc-500">{name}</p>
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
  );
}
