"use client";

import { AreaSeries, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";

import { parseTimeMs } from "@/lib/time";

export function MiniSparkline({
  points,
  trend,
}: {
  points: { time: string; value: number }[];
  trend: "up" | "down";
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = chartRef.current;
    if (!container) {
      return;
    }

    const chart = createChart(container, {
      width: container.clientWidth,
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
      lineColor: "#22c55e",
      topColor: "rgba(34, 197, 94, 0.25)",
      bottomColor: "rgba(0,0,0,0)",
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chartApiRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver(() => {
      const node = chartRef.current;
      if (!node) {
        return;
      }
      chart.resize(node.clientWidth, 52);
    });
    observer.observe(container);
    resizeObserverRef.current = observer;

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      seriesRef.current = null;
      chartApiRef.current = null;
      chart.remove();
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    series.applyOptions({
      lineColor: trend === "up" ? "#22c55e" : "#ef4444",
      topColor: trend === "up" ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)",
    });
  }, [trend]);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartApiRef.current;
    if (!series || !chart) return;

    series.setData(
      points.map((point, index) => {
        const timeMs = parseTimeMs(point.time);
        const time = timeMs ? Math.floor(timeMs / 1000) : index + 1;
        return { time: time as UTCTimestamp, value: point.value };
      }),
    );

    chart.timeScale().fitContent();
  }, [points]);

  return <div ref={chartRef} className="h-[52px] w-full" />;
}
