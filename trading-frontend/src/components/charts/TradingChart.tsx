"use client";

import {
  AreaSeries,
  BaselineSeries,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import { PricePoint } from "@/types/market";

type SeriesHandle = {
  areaSeries: ISeriesApi<"Area">;
  volumeSeries: ISeriesApi<"Histogram">;
  baselineSeries: ISeriesApi<"Baseline">;
};

export function TradingChart({ data, onHoverPrice }: { data: PricePoint[]; onHoverPrice?: (price: number | null, time: string | null) => void }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) {
      return;
    }

    const container = chartRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 334,
      layout: {
        background: { color: "#161820" },
        textColor: "rgba(255,255,255,0.58)",
        fontFamily: '"Google Sans", "Segoe UI", sans-serif',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.07)" },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,255,255,0.15)",
          width: 1,
          labelBackgroundColor: "#20232d",
        },
        horzLine: {
          visible: true,
          color: "rgba(255,255,255,0.15)",
          width: 1,
          labelBackgroundColor: "#20232d",
        },
      },
      leftPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.06, bottom: 0.22 },
        ticksVisible: false,
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        ticksVisible: false,
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisDoubleClickReset: false,
        mouseWheel: false,
        pinch: false,
      },
    });

    const { areaSeries, volumeSeries, baselineSeries } = buildSeries(chart);
    const chartRows = buildChartRows(data);

    areaSeries.setData(chartRows.areaData);
    volumeSeries.setData(chartRows.volumeData);
    baselineSeries.setData(chartRows.baselineData);
    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      const tooltip = tooltipRef.current;
      const container = chartRef.current;
      if (!tooltip || !container) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        tooltip.style.display = "none";
        onHoverPrice?.(null, null);
      } else {
        const priceObj = param.seriesData.get(areaSeries) as any;
        if (!priceObj || typeof priceObj.value !== "number") {
          tooltip.style.display = "none";
          onHoverPrice?.(null, null);
          return;
        }

        let dateStr;
        if (typeof param.time === "number") {
          dateStr = new Date(param.time * 1000).toLocaleString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          dateStr = String(param.time);
        }

        tooltip.style.display = "block";
        tooltip.innerHTML = `
          <div style="color: #fff; font-size: 15px; font-weight: 600; letter-spacing: -0.01em;">₹${priceObj.value.toFixed(2)}</div>
          <div style="color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 3px;">${dateStr}</div>
        `;
        onHoverPrice?.(priceObj.value, dateStr);

        const toolTipWidth = 100;
        const toolTipHeight = 50;
        const margin = 14;
        let left = param.point.x + margin;
        if (left + toolTipWidth > container.clientWidth) {
          left = param.point.x - toolTipWidth - margin;
        }
        let top = param.point.y - toolTipHeight - margin;
        if (top < margin) {
          top = param.point.y + margin;
        }

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
      }
    });

    const observer = new ResizeObserver(() => {
      chart.resize(container.clientWidth, 334);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data]);

  return (
    <div className="relative h-[334px] w-full rounded-[22px]">
      <div ref={chartRef} className="h-full w-full" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-50 rounded-xl bg-[#20232d] px-4 py-2.5 shadow-2xl border border-white/10"
        style={{ display: "none", top: 0, left: 0 }}
      />
    </div>
  );
}

function buildSeries(chart: IChartApi): SeriesHandle {
  const areaSeries = chart.addSeries(AreaSeries, {
    lineColor: "#91ec91",
    lineWidth: 2,
    topColor: "rgba(136, 227, 138, 0.34)",
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: "#fff",
    crosshairMarkerBackgroundColor: "#B5F2B5",
    lastValueVisible: false,
    priceLineVisible: false,
  });

  const volumeSeries = chart.addSeries(HistogramSeries, {
    priceScaleId: "",
    base: 0,
    lastValueVisible: false,
    priceLineVisible: false,
  });

  volumeSeries.priceScale().applyOptions({
    scaleMargins: { top: 0.78, bottom: 0 },
    visible: false,
  });

  const baselineSeries = chart.addSeries(BaselineSeries, {
    baseValue: { type: "price", price: 0 },
    topFillColor1: "rgba(0,0,0,0)",
    topFillColor2: "rgba(0,0,0,0)",
    topLineColor: "rgba(209, 213, 219, 0.72)",
    bottomFillColor1: "rgba(0,0,0,0)",
    bottomFillColor2: "rgba(0,0,0,0)",
    bottomLineColor: "rgba(209, 213, 219, 0.72)",
    lineWidth: 1,
    lineStyle: LineStyle.Dotted,
    lastValueVisible: false,
    priceLineVisible: false,
    crosshairMarkerVisible: false,
  });

  return { areaSeries, volumeSeries, baselineSeries };
}

function buildChartRows(data: PricePoint[]) {
  const first = data[0]?.value ?? 0;
  const baseline = Math.max(first - 25, 0);
  const areaData = data.map((point, index) => ({
    time: toChartTime(point.time, index),
    value: point.value,
  }));

  const volumeData = data.map((point, index, rows) => {
    const previous = rows[index - 1]?.value ?? point.value;
    const delta = point.value - previous;

    return {
      time: toChartTime(point.time, index),
      value: Math.max(Math.abs(delta) * 9, 2),
      color: delta >= 0 ? "rgba(136, 227, 138, 0.42)" : "rgba(255, 150, 150, 0.36)",
    };
  });

  const baselineData = data.map((point, index) => ({
    time: toChartTime(point.time, index),
    value: baseline,
  }));

  return { areaData, volumeData, baselineData };
}

function toChartTime(time: string, index: number) {
  const parsed = Math.floor(new Date(time).getTime() / 1000);
  return (Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1) as UTCTimestamp;
}
