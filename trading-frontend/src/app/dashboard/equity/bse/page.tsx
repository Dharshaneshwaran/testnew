import { Header } from "@/components/layout/Header";
import { MarketCard } from "@/components/market/MarketCard";
import { topGainers } from "@/lib/mock/marketData";

export default function EquityBsePage() {
  return (
    <main className="min-h-screen">
      <Header title="Cash / Equity - BSE" subtitle="BSE equities watch" />
      <div className="grid gap-4 px-4 py-4 md:grid-cols-2 lg:px-6">
        {topGainers.map((item) => (
          <MarketCard
            key={item.symbol}
            symbol={item.symbol}
            name={item.name}
            ltp={item.ltp}
            changePercent={item.changePercent}
          />
        ))}
      </div>
    </main>
  );
}
