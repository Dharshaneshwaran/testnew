"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { ExpiryDropdown } from "@/components/options/ExpiryDropdown";
import { OptionChainTable } from "@/components/options/OptionChainTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optionChainRows, optionExpiries } from "@/lib/mock/optionData";

export default function IndexOptionsPage() {
  const [selectedExpiry, setSelectedExpiry] = useState(optionExpiries[0].value);

  return (
    <main className="min-h-screen">
      <Header title="Index Options" subtitle="NIFTY Option Chain" />
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>NIFTY Option Chain</CardTitle>
              <p className="text-sm text-zinc-500">TradingView-inspired dark table layout</p>
            </div>
            <ExpiryDropdown value={selectedExpiry} options={optionExpiries} onChange={setSelectedExpiry} />
          </CardHeader>
          <CardContent>
            <OptionChainTable rows={optionChainRows} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
