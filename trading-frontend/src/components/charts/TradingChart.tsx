"use client";

import { AreaSeries, createChart, CrosshairMode, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";

import { PricePoint } from "@/types/market";

export function TradingChart({ data }: { data: PricePoint[] }) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 340,
      layout: {
        background: { color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,255,255,0.25)",
          labelBackgroundColor: "#18181b",
        },
        horzLine: {
          color: "rgba(255,255,255,0.2)",
          labelBackgroundColor: "#18181b",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#22c55e",
      lineWidth: 2,
      topColor: "rgba(34, 197, 94, 0.35)",
      bottomColor: "rgba(34, 197, 94, 0.02)",
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#22c55e",
      crosshairMarkerBackgroundColor: "#052e16",
      priceLineColor: "#22c55e",
    });

    series.setData(data.map((point, index) => ({ time: (index + 1) as UTCTimestamp, value: point.value })));
    chart.timeScale().fitContent();

    const observer = new ResizeObserver(() => {
      if (!chartRef.current) {
        return;
      }
      chart.resize(chartRef.current.clientWidth, 340);
    });

    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data]);

  return <div ref={chartRef} className="h-[340px] w-full" />;
}
