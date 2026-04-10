import { Bell, Search, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/75 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 lg:text-xl">{title}</h1>
          <p className="text-xs text-zinc-500 lg:text-sm">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative hidden items-center md:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-500" />
            <input
              placeholder="Search stocks, futures, options"
              className="w-72 rounded-xl border border-white/10 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-400"
            />
          </label>
          <Badge className="hidden bg-emerald-500/15 text-emerald-300 lg:inline-flex">Live</Badge>
          <button className="rounded-lg border border-white/10 bg-zinc-900 p-2 text-zinc-300 transition hover:text-zinc-100">
            <Bell className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-white/10 bg-zinc-900 p-2 text-zinc-300 transition hover:text-zinc-100">
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
