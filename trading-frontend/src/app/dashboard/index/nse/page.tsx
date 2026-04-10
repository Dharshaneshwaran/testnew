import { Header } from "@/components/layout/Header";
import { PriceTicker } from "@/components/market/PriceTicker";
import { miniSparklineData, topTickers } from "@/lib/mock/marketData";

export default function IndexNsePage() {
  return (
    <main className="min-h-screen">
      <Header title="Index - NSE" subtitle="Nifty family indices" />
      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 lg:px-6 xl:grid-cols-3">
        <PriceTicker ticker={topTickers[0]} sparkline={miniSparklineData.NIFTY} />
        <PriceTicker ticker={topTickers[2]} sparkline={miniSparklineData.BANKNIFTY} />
      </div>
    </main>
  );
}
