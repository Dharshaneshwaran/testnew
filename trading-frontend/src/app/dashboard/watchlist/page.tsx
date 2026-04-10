import { Header } from "@/components/layout/Header";
import { WatchlistFolder } from "@/components/watchlist/WatchlistFolder";
import { watchlistFolders } from "@/lib/mock/watchlistData";

export default function WatchlistPage() {
  return (
    <main className="min-h-screen">
      <Header title="Watchlist" subtitle="Saved market instruments" />
      <div className="space-y-3 px-4 py-4 lg:px-6">
        {watchlistFolders.map((folder) => (
          <WatchlistFolder key={folder.id} folder={folder} />
        ))}
      </div>
    </main>
  );
}
