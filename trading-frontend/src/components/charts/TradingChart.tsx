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

export function TradingChart({ data }: { data: PricePoint[] }) {
  const chartRef = useRef<HTMLDivElement | null>(null);

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
          visible: false,
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

    const observer = new ResizeObserver(() => {
      chart.resize(container.clientWidth, 334);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data]);

  return <div ref={chartRef} className="h-[334px] w-full rounded-[22px]" />;
}

function buildSeries(chart: IChartApi): SeriesHandle {
  const areaSeries = chart.addSeries(AreaSeries, {
    lineColor: "#91ec91",
    lineWidth: 2,
    topColor: "rgba(136, 227, 138, 0.34)",
    bottomColor: "rgba(136, 227, 138, 0.02)",
    crosshairMarkerRadius: 0,
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
