"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { WatchlistTable } from "@/components/watchlist/WatchlistTable";
import { getWatchlistFolders } from "@/lib/api/watchlist";
import { WatchlistFolderType } from "@/types/watchlist";

export default function WatchlistPage() {
  const { token } = useAuth();
  const [folders, setFolders] = useState<WatchlistFolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) {
        return;
      }

      try {
        const response = await getWatchlistFolders(token);
        setFolders(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  return (
    <main className="min-h-screen">
      <Header title="Watchlist" subtitle="Saved market instruments" />
      <div className="space-y-3 px-4 py-4 lg:px-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading watchlist...</p>}
        {!loading && <WatchlistTable folders={folders} />}
      </div>
    </main>
  );
}
