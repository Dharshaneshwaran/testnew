"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Siren, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Section = {
  label: string;
  icon?: React.ReactNode;
  children?: { label: string; href: string }[];
  href?: string;
};

const sections: Section[] = [
  { label: "Watchlist", icon: <Star className="h-4 w-4" />, href: "/dashboard/watchlist" },
  {
    label: "Index",
    children: [
      { label: "NSE", href: "/dashboard/index/nse" },
      { label: "BSE", href: "/dashboard/index/bse" },
    ],
  },
  {
    label: "Cash / Equity",
    children: [
      { label: "NSE", href: "/dashboard/equity/nse" },
      { label: "BSE", href: "/dashboard/equity/bse" },
    ],
  },
  {
    label: "Futures",
    children: [
      { label: "Stock Futures", href: "/dashboard/futures/stock" },
      { label: "Index Futures", href: "/dashboard/futures/index" },
    ],
  },
  {
    label: "Options",
    children: [
      { label: "Stock Options", href: "/dashboard/options/stock" },
      { label: "Index Options", href: "/dashboard/options/index" },
    ],
  },
  { label: "Alerts", icon: <Siren className="h-4 w-4" />, href: "/dashboard" },
];

export function Sidebar() {
  const pathname = usePathname();
  const defaultOpen = useMemo(() => new Set(["Index", "Cash / Equity", "Futures", "Options"]), []);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.label, defaultOpen.has(s.label)])),
  );

  const toggle = (label: string) => {
    setOpenMap((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-zinc-950/90 px-3 py-4 lg:block">
      <div className="mb-4 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Markets</p>
        <h2 className="text-xl font-semibold text-zinc-100">TradeBoard Pro</h2>
      </div>
      <nav className="space-y-1">
        {sections.map((section) => {
          const isOpen = openMap[section.label];

          if (section.children) {
            return (
              <div key={section.label} className="rounded-xl border border-white/5 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => toggle(section.label)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/[0.03]"
                >
                  <span>{section.label}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <div className="border-t border-white/5 p-1">
                    {section.children.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100",
                            active && "bg-emerald-500/15 text-emerald-300",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = section.href ? pathname === section.href : false;
          return (
            <Link
              key={section.label}
              href={section.href ?? "/dashboard"}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.03]",
                active && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
              )}
            >
              {section.icon}
              <span>{section.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
