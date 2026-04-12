"use client";

import { useMemo, useRef, useState } from "react";
import { BarChart3, Droplets, IndianRupee, Layers } from "lucide-react";

import type { OptionChainRow } from "@/types/option";
import { cn } from "@/lib/utils";

type Metric = "oi" | "iv" | "volume" | "ltp";

const METRICS: Array<{ key: Metric; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "oi", label: "Open Interest", icon: Layers },
  { key: "iv", label: "IV", icon: Droplets },
  { key: "volume", label: "Volume", icon: BarChart3 },
  { key: "ltp", label: "LTP", icon: IndianRupee },
];

function formatCompact(value: number) {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, metric: Metric) {
  if (!Number.isFinite(value)) return "--";
  if (metric === "iv") return `${value.toFixed(2)}%`;
  if (metric === "ltp") return value.toFixed(2);
  return formatCompact(value);
}

type Point = { x: number; y: number; strike: number; ce: number; pe: number };

export function OptionChainChart({ rows }: { rows: OptionChainRow[] }) {
  const [metric, setMetric] = useState<Metric>("oi");
  const [hover, setHover] = useState<Point | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.strike - b.strike).slice(0, 120),
    [rows],
  );

  const series = useMemo(() => {
    const ce = sorted.map((r) => (metric === "oi" ? r.ce.oi : metric === "iv" ? r.ce.iv : metric === "volume" ? r.ce.volume : r.ce.ltp));
    const pe = sorted.map((r) => (metric === "oi" ? r.pe.oi : metric === "iv" ? r.pe.iv : metric === "volume" ? r.pe.volume : r.pe.ltp));
    const max = Math.max(1, ...ce, ...pe);
    return { ce, pe, max };
  }, [sorted, metric]);

  const points = useMemo(() => {
    const width = 960;
    const height = 220;
    const padding = { left: 54, right: 18, top: 14, bottom: 34 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    const count = Math.max(1, sorted.length);

    const out: {
      width: number;
      height: number;
      padding: typeof padding;
      plotW: number;
      plotH: number;
      ce: Point[];
      pe: Point[];
      ticks: Array<{ x: number; label: string }>;
      yTicks: Array<{ y: number; label: string }>;
    } = {
      width,
      height,
      padding,
      plotW,
      plotH,
      ce: [],
      pe: [],
      ticks: [],
      yTicks: [],
    };

    const xAt = (i: number) => padding.left + (count === 1 ? plotW / 2 : (i / (count - 1)) * plotW);
    const yAt = (v: number) => padding.top + plotH - (v / series.max) * plotH;

    for (let i = 0; i < count; i++) {
      out.ce.push({ x: xAt(i), y: yAt(series.ce[i] ?? 0), strike: sorted[i]!.strike, ce: series.ce[i] ?? 0, pe: series.pe[i] ?? 0 });
      out.pe.push({ x: xAt(i), y: yAt(series.pe[i] ?? 0), strike: sorted[i]!.strike, ce: series.ce[i] ?? 0, pe: series.pe[i] ?? 0 });
    }

    // x ticks (4 labels)
    const tickCount = Math.min(4, count);
    for (let t = 0; t < tickCount; t++) {
      const idx = Math.round((t / Math.max(1, tickCount - 1)) * (count - 1));
      out.ticks.push({ x: xAt(idx), label: String(sorted[idx]!.strike) });
    }

    // y ticks (3)
    for (let t = 0; t <= 2; t++) {
      const value = (series.max * t) / 2;
      out.yTicks.push({ y: yAt(value), label: formatCompact(value) });
    }

    return out;
  }, [sorted, series, metric]);

  const cePath = useMemo(() => toPath(points.ce), [points.ce]);
  const pePath = useMemo(() => toPath(points.pe), [points.pe]);

  const handleMove = (event: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const all = points.ce;
    if (all.length === 0) return;
    let best = all[0]!;
    let bestDist = Math.abs(best.x - x);
    for (const p of all) {
      const dist = Math.abs(p.x - x);
      if (dist < bestDist) {
        best = p;
        bestDist = dist;
      }
    }
    setHover(best);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Option chain chart</p>
          <p className="mt-0.5 text-xs text-zinc-500">CE vs PE across strikes</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {METRICS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition",
                metric === key
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-4 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#161820]"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${points.width} ${points.height}`} className="h-[260px] w-full">
          {/* grid */}
          {points.yTicks.map((t) => (
            <g key={t.y}>
              <line
                x1={points.padding.left}
                x2={points.width - points.padding.right}
                y1={t.y}
                y2={t.y}
                stroke="rgba(255,255,255,0.07)"
              />
              <text x={points.padding.left - 10} y={t.y + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.45)">
                {t.label}
              </text>
            </g>
          ))}

          {/* x axis labels */}
          {points.ticks.map((t) => (
            <text key={t.x} x={t.x} y={points.height - 12} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.45)">
              {t.label}
            </text>
          ))}

          {/* series */}
          <path d={cePath} fill="none" stroke="rgba(136,227,138,0.95)" strokeWidth="2.2" />
          <path d={pePath} fill="none" stroke="rgba(242,139,130,0.95)" strokeWidth="2.2" />

          {/* hover */}
          {hover && (
            <>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={points.padding.top}
                y2={points.height - points.padding.bottom}
                stroke="rgba(255,255,255,0.18)"
              />
              <circle cx={hover.x} cy={hover.y} r="4.5" fill="#ffffff" stroke="rgba(136,227,138,0.9)" strokeWidth="2" />
              <circle
                cx={hover.x}
                cy={points.pe.find((p) => p.strike === hover.strike)?.y ?? hover.y}
                r="4.5"
                fill="#ffffff"
                stroke="rgba(242,139,130,0.9)"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {hover && (
          <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-white/10 bg-[#20232d]/90 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur">
            <div className="text-[11px] text-white/60">Strike</div>
            <div className="text-sm font-semibold text-white">{hover.strike}</div>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="text-white/60">CE</div>
              <div className="text-white/60 text-right">PE</div>
              <div className="font-semibold text-emerald-200">{formatNumber(hover.ce, metric)}</div>
              <div className="font-semibold text-right text-red-200">{formatNumber(hover.pe, metric)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-white/60">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          CE
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          PE
        </span>
      </div>
    </div>
  );
}

function toPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i]!.x.toFixed(2)} ${points[i]!.y.toFixed(2)}`;
  }
  return d;
}

