"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { ExpiryDropdown } from "@/components/options/ExpiryDropdown";
import { OptionChainTable } from "@/components/options/OptionChainTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpiries, getOptionChain } from "@/lib/api/options";
import { ExpiryItem, OptionChainRow } from "@/types/option";

export default function IndexOptionsPage() {
  const [expiries, setExpiries] = useState<ExpiryItem[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [rows, setRows] = useState<OptionChainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExpiries() {
      try {
        const nextExpiries = await getExpiries("NIFTY");
        setExpiries(nextExpiries);
        if (nextExpiries[0]) {
          setSelectedExpiry(nextExpiries[0].value);
        } else {
          setLoading(false);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load expiries");
        setLoading(false);
      }
    }

    void loadExpiries();
  }, []);

  useEffect(() => {
    async function loadChain() {
      if (!selectedExpiry) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextRows = await getOptionChain("NIFTY", selectedExpiry);
        setRows(nextRows);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load option chain");
      } finally {
        setLoading(false);
      }
    }

    void loadChain();
  }, [selectedExpiry]);

  return (
    <main className="min-h-screen">
      <Header title="Index Options" subtitle="NIFTY Option Chain" />
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>NIFTY Option Chain</CardTitle>
              <p className="text-sm text-zinc-500">Live data from backend API</p>
            </div>
            <ExpiryDropdown value={selectedExpiry} options={expiries} onChange={setSelectedExpiry} />
          </CardHeader>
          <CardContent>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            {loading ? (
              <p className="text-sm text-zinc-500">Loading option chain...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-zinc-500">No option chain data available for this expiry.</p>
            ) : (
              <OptionChainTable rows={rows} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
