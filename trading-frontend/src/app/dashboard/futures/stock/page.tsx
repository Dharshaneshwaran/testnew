import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stockFutures = [
  { contract: "RELIANCE APR FUT", ltp: 2962.5, oi: 187230, change: 1.21 },
  { contract: "SBIN APR FUT", ltp: 825.2, oi: 214550, change: 2.03 },
  { contract: "TCS APR FUT", ltp: 3952.1, oi: 162120, change: -1.09 },
];

export default function StockFuturesPage() {
  return (
    <main className="min-h-screen">
      <Header title="Stock Futures" subtitle="Most active stock derivatives" />
      <div className="space-y-3 px-4 py-4 lg:px-6">
        {stockFutures.map((row) => (
          <Card key={row.contract}>
            <CardHeader>
              <CardTitle>{row.contract}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-6 text-sm">
              <p className="text-zinc-100">LTP: {row.ltp.toFixed(2)}</p>
              <p className="text-zinc-400">OI: {Intl.NumberFormat("en-IN").format(row.oi)}</p>
              <p className={row.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                {row.change >= 0 ? "+" : ""}
                {row.change.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
