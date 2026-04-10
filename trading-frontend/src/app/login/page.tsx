import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-zinc-950/80">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">TradeBoard Pro</p>
          <CardTitle className="mt-1 text-2xl">Welcome back</CardTitle>
          <p className="text-sm text-zinc-500">Sign in to continue to your trading dashboard.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-400">Email</span>
            <input className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400" placeholder="you@trader.com" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-400">Password</span>
            <input type="password" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-400" placeholder="••••••••" />
          </label>
          <Link href="/dashboard" className="block">
            <Button className="w-full bg-emerald-500/90 font-medium text-black hover:bg-emerald-400">Enter Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
