"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAlert, getAlerts, toggleAlert } from "@/lib/api/alerts";
import { AlertCondition, AlertItem } from "@/types/alert";

const CONDITION_OPTIONS: { value: AlertCondition; label: string }[] = [
  { value: "ABOVE", label: "Price moves above" },
  { value: "BELOW", label: "Price moves below" },
];

export default function AlertsPage() {
  const { token, status } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [symbol, setSymbol] = useState("");
  const [condition, setCondition] = useState<AlertCondition>("ABOVE");
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      if (status !== "authenticated" || !token) {
        return;
      }

      try {
        setError(null);
        const response = await getAlerts(token);
        setAlerts(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    }

    void loadAlerts();
  }, [status, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createAlert(
        {
          symbol: symbol.trim().toUpperCase(),
          condition,
          targetPrice: Number(targetPrice),
          isActive: true,
        },
        token,
      );

      setAlerts((current) => [created, ...current]);
      setSymbol("");
      setTargetPrice("");
      setCondition("ABOVE");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    if (!token) {
      return;
    }

    setTogglingId(id);
    setError(null);

    try {
      const updated = await toggleAlert(id, token);
      setAlerts((current) => current.map((alert) => (alert.id === id ? updated : alert)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update alert");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <main className="min-h-screen">
      <Header title="Alerts" subtitle="Create and manage your price alerts" />
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Create Alert</CardTitle>
            <p className="text-sm text-zinc-500">Trigger notifications when a symbol crosses your target.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400">Symbol</span>
                <input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                  placeholder="RELIANCE"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400">Condition</span>
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value as AlertCondition)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400">Target Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetPrice}
                  onChange={(event) => setTargetPrice(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                  placeholder="2500"
                  required
                />
              </label>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-500/90 font-medium text-black hover:bg-emerald-400"
              >
                {submitting ? "Creating..." : "Create Alert"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Alerts</CardTitle>
            <p className="text-sm text-zinc-500">Toggle active alerts without leaving the dashboard.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-zinc-500">Loading alerts...</p>}

            {!loading && alerts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400">
                No alerts yet. Create your first rule to track a breakout or downside breach.
              </div>
            )}

            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-zinc-100">{alert.symbol}</p>
                    <Badge
                      className={
                        alert.isActive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/5 text-zinc-400"
                      }
                    >
                      {alert.isActive ? "Active" : "Paused"}
                    </Badge>
                    <Badge className="border-white/10 bg-zinc-800 text-zinc-200">
                      {alert.condition === "ABOVE" ? "Above" : "Below"} ₹
                      {alert.targetPrice.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Created {new Date(alert.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>

                <Button
                  type="button"
                  disabled={togglingId === alert.id}
                  onClick={() => void handleToggle(alert.id)}
                  className={
                    alert.isActive
                      ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      : "bg-emerald-500/90 text-black hover:bg-emerald-400"
                  }
                >
                  {togglingId === alert.id
                    ? "Updating..."
                    : alert.isActive
                      ? "Pause Alert"
                      : "Activate Alert"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
