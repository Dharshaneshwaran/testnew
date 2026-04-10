import { Header } from "@/components/layout/Header";
import { PriceTicker } from "@/components/market/PriceTicker";
import { miniSparklineData, topTickers } from "@/lib/mock/marketData";

export default function IndexBsePage() {
  return (
    <main className="min-h-screen">
      <Header title="Index - BSE" subtitle="Sensex and BSE benchmarks" />
      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 lg:px-6 xl:grid-cols-3">
        <PriceTicker ticker={topTickers[1]} sparkline={miniSparklineData.SENSEX} />
      </div>
    </main>
  );
}
