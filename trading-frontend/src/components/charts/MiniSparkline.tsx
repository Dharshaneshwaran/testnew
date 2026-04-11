"use client";

import { AreaSeries, createChart, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";

export function MiniSparkline({
  points,
  trend,
}: {
  points: { time: string; value: number }[];
  trend: "up" | "down";
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current || points.length === 0) {
      return;
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 52,
      layout: {
        background: { color: "transparent" },
        textColor: "#71717a",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      leftPriceScale: { visible: false },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: trend === "up" ? "#22c55e" : "#ef4444",
      topColor: trend === "up" ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)",
      bottomColor: "rgba(0,0,0,0)",
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    series.setData(
      points.map((point, index) => ({
        time: (
          Math.floor(new Date(point.time).getTime() / 1000) || index + 1
        ) as UTCTimestamp,
        value: point.value,
      })),
    );
    chart.timeScale().fitContent();

    const observer = new ResizeObserver(() => {
      if (!chartRef.current) {
        return;
      }
      chart.resize(chartRef.current.clientWidth, 52);
    });

    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [points, trend]);

  return <div ref={chartRef} className="h-[52px] w-full" />;
}
