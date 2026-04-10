import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const indexFutures = [
  { contract: "NIFTY APR FUT", ltp: 22830.4, oi: 741200, change: 0.62 },
  { contract: "BANKNIFTY APR FUT", ltp: 48810.8, oi: 598440, change: -0.18 },
  { contract: "FINNIFTY APR FUT", ltp: 23411.3, oi: 432220, change: 0.39 },
];

export default function IndexFuturesPage() {
  return (
    <main className="min-h-screen">
      <Header title="Index Futures" subtitle="Live index derivatives snapshot" />
      <div className="space-y-3 px-4 py-4 lg:px-6">
        {indexFutures.map((row) => (
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
