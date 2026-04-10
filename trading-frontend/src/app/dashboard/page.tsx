import { Header } from "@/components/layout/Header";
import { TradingChart } from "@/components/charts/TradingChart";
import { MarketCard } from "@/components/market/MarketCard";
import { PriceTicker } from "@/components/market/PriceTicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WatchlistFolder } from "@/components/watchlist/WatchlistFolder";
import {
  chartPoints,
  miniSparklineData,
  sectorCards,
  selectedStock,
  topGainers,
  topLosers,
  topTickers,
} from "@/lib/mock/marketData";
import { watchlistFolders } from "@/lib/mock/watchlistData";

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <Header title="Dashboard" subtitle="Indian markets overview" />
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <PriceTicker ticker={topTickers[0]} sparkline={miniSparklineData.NIFTY} />
          <PriceTicker ticker={topTickers[1]} sparkline={miniSparklineData.SENSEX} />
          <PriceTicker ticker={topTickers[2]} sparkline={miniSparklineData.BANKNIFTY} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr_320px]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-zinc-100">{selectedStock.symbol}</CardTitle>
                <p className="text-sm text-zinc-500">{selectedStock.name}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <p className="text-3xl font-semibold text-zinc-100">₹{selectedStock.price.toFixed(2)}</p>
                  <p className="text-sm font-medium text-emerald-400">
                    +{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                  <span>Volume: {selectedStock.volume}</span>
                  <span>Day Range: {selectedStock.dayRange}</span>
                  <span>MCap: {selectedStock.marketCap}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <TradingChart data={chartPoints} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sectors Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {sectorCards.map((sector) => (
                    <div key={sector.name} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm transition hover:bg-white/[0.04]">
                      <p className="text-zinc-200">{sector.name}</p>
                      <p className={sector.performance >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {sector.performance >= 0 ? "+" : ""}
                        {sector.performance.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Gainers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topGainers.map((item) => (
                  <MarketCard
                    key={item.symbol}
                    symbol={item.symbol}
                    name={item.name}
                    ltp={item.ltp}
                    changePercent={item.changePercent}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Losers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topLosers.map((item) => (
                  <MarketCard
                    key={item.symbol}
                    symbol={item.symbol}
                    name={item.name}
                    ltp={item.ltp}
                    changePercent={item.changePercent}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Watchlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {watchlistFolders.map((folder) => (
                  <WatchlistFolder key={folder.id} folder={folder} />
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
