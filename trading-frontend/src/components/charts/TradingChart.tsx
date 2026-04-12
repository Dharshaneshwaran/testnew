"use client";

import {
  AreaSeries,
  BaselineSeries,
  CandlestickSeries,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import { PricePoint } from "@/types/market";

export type TradingChartVariant = "area" | "candles" | "line";

type SeriesHandle = {
  primarySeries: ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | ISeriesApi<"Line">;
  volumeSeries: ISeriesApi<"Histogram">;
  baselineSeries: ISeriesApi<"Baseline">;
};

export function TradingChart({
  data,
  variant = "area",
  onHoverPrice,
}: {
  data: PricePoint[];
  variant?: TradingChartVariant;
  onHoverPrice?: (price: number | null, time: string | null) => void;
}) {
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
        background: { color: "#10131a" },
        textColor: "rgba(255,255,255,0.62)",
        fontFamily: '"Google Sans", "Segoe UI", sans-serif',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.07)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(255,255,255,0.18)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#20232d",
        },
        horzLine: {
          visible: true,
          color: "rgba(255,255,255,0.18)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#20232d",
        },
      },
      leftPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.24 },
        ticksVisible: true,
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        ticksVisible: true,
        rightOffset: 2,
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
      localization: {
        priceFormatter: (price: number) => price.toFixed(2),
        timeFormatter: (time: UTCTimestamp) => {
          const date = new Date(Number(time) * 1000);
          if (Number.isNaN(date.getTime())) return String(time);
          const day = date.getDate().toString().padStart(2, "0");
          const month = date.toLocaleString("en-IN", { month: "short" });
          const year = date.getFullYear().toString().slice(-2);
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          return `${day} ${month} '${year} ${hours}:${minutes}`;
        },
      },
    });

    const { primarySeries, volumeSeries, baselineSeries } = buildSeries(chart, variant);
    const chartRows = buildChartRows(data);

    if (variant === "candles") {
      (primarySeries as ISeriesApi<"Candlestick">).setData(chartRows.candleData);
    } else {
      (primarySeries as ISeriesApi<"Area"> | ISeriesApi<"Line">).setData(chartRows.lineData);
    }
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
        const priceObj = param.seriesData.get(primarySeries) as any;
        const value =
          priceObj && typeof priceObj.value === "number"
            ? priceObj.value
            : priceObj && typeof priceObj.close === "number"
              ? priceObj.close
              : null;

        if (value === null) {
          tooltip.style.display = "none";
          onHoverPrice?.(null, null);
          return;
        }

        let dateStr;
        if (typeof param.time === "number") {
          dateStr = new Date(param.time * 1000).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } else {
          dateStr = String(param.time);
        }

        tooltip.style.display = "block";
        tooltip.innerHTML = `
          <div style="color: #fff; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">₹${value.toFixed(2)}</div>
          <div style="color: rgba(255,255,255,0.55); font-size: 12px; margin-top: 6px;">${dateStr}</div>
        `;
        onHoverPrice?.(value, dateStr);

        const toolTipWidth = 150;
        const toolTipHeight = 70;
        const margin = 18;
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
  }, [data, variant, onHoverPrice]);

  return (
    <div className="relative h-[334px] w-full rounded-[22px]">
      <div ref={chartRef} className="h-full w-full" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-50 rounded-2xl bg-[#20232d]/95 px-5 py-4 shadow-2xl border border-white/10 backdrop-blur"
        style={{ display: "none", top: 0, left: 0 }}
      />
    </div>
  );
}

function buildSeries(chart: IChartApi, variant: TradingChartVariant): SeriesHandle {
  const primarySeries =
    variant === "candles"
      ? chart.addSeries(CandlestickSeries, {
          upColor: "rgba(136, 227, 138, 0.98)",
          downColor: "rgba(242, 139, 130, 0.98)",
          borderVisible: false,
          wickUpColor: "rgba(136, 227, 138, 0.98)",
          wickDownColor: "rgba(242, 139, 130, 0.98)",
          lastValueVisible: false,
          priceLineVisible: false,
          priceFormat: { type: "price", precision: 2, minMove: 0.05 },
        })
      : variant === "line"
        ? chart.addSeries(LineSeries, {
            color: "#91ec91",
            lineWidth: 2,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: "#fff",
            crosshairMarkerBackgroundColor: "#B5F2B5",
            lastValueVisible: false,
            priceLineVisible: false,
            priceFormat: { type: "price", precision: 2, minMove: 0.05 },
          })
        : chart.addSeries(AreaSeries, {
            lineColor: "#91ec91",
            lineWidth: 2,
            topColor: "rgba(136, 227, 138, 0.34)",
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: "#fff",
            crosshairMarkerBackgroundColor: "#B5F2B5",
            lastValueVisible: false,
            priceLineVisible: false,
            priceFormat: { type: "price", precision: 2, minMove: 0.05 },
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
    lineStyle: LineStyle.Dashed,
    lastValueVisible: false,
    priceLineVisible: false,
    crosshairMarkerVisible: false,
  });

  return { primarySeries, volumeSeries, baselineSeries };
}

function buildChartRows(data: PricePoint[]) {
  const first = data[0]?.value ?? 0;
  const baseline = Math.max(first - 25, 0);
  const lineData = data.map((point, index) => ({
    time: toChartTime(point.time, index),
    value: point.value,
  }));

  const candleData = data.map((point, index, rows) => {
    const close = point.value;
    const prev = rows[index - 1]?.value ?? close;
    const open = prev;
    const body = Math.abs(close - open);
    const base = Math.max(close, open);
    const wick = Math.max(body * 1.25, base * 0.0032);
    const high = Math.max(open, close) + wick * 0.55;
    const low = Math.max(0, Math.min(open, close) - wick * 0.55);

    return {
      time: toChartTime(point.time, index),
      open,
      high,
      low,
      close,
    };
  });

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

  return { lineData, candleData, volumeData, baselineData };
}

function toChartTime(time: string, index: number) {
  const parsed = Math.floor(new Date(time).getTime() / 1000);
  return (Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1) as UTCTimestamp;
}
