"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { ExpiryDropdown } from "@/components/options/ExpiryDropdown";
import { OptionChainTable } from "@/components/options/OptionChainTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optionChainRows, optionExpiries } from "@/lib/mock/optionData";

export default function StockOptionsPage() {
  const [selectedExpiry, setSelectedExpiry] = useState(optionExpiries[0].value);

  return (
    <main className="min-h-screen">
      <Header title="Stock Options" subtitle="Option chain for stock contracts" />
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>RELIANCE Option Chain</CardTitle>
              <p className="text-sm text-zinc-500">CE/PE OI, IV, Volume and LTP</p>
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
