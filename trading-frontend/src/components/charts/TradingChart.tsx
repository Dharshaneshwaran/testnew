"use client";

import {
  AreaSeries,
  type BarData,
  CandlestickSeries,
  type CustomData,
  createChart,
  CrosshairMode,
  type HistogramData,
  HistogramSeries,
  type LineData,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  TickMarkType,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import { PricePoint } from "@/types/market";

export type TradingChartVariant = "area" | "candles" | "line";
type ChartTheme = "dark" | "light";

type PrimarySeries = ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | ISeriesApi<"Line">;

type SeriesHandle = {
  variant: TradingChartVariant;
  primarySeries: PrimarySeries;
  volumeSeries: ISeriesApi<"Histogram">;
  referenceLine: IPriceLine | null;
};

export function TradingChart({
  data,
  variant = "area",
  onHoverPrice,
  onHoverCandle,
  referencePrice,
  timeZone = "Asia/Kolkata",
  height = 334,
}: {
  data: PricePoint[];
  variant?: TradingChartVariant;
  onHoverPrice?: (price: number | null, time: string | null) => void;
  onHoverCandle?: (
    candle: { open: number; high: number; low: number; close: number } | null,
    time: string | null,
  ) => void;
  referencePrice?: number | null;
  timeZone?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipPriceRef = useRef<HTMLDivElement | null>(null);
  const tooltipTimeRef = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<SeriesHandle | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dataMetaRef = useRef<{ first: string; last: string; len: number } | null>(null);
  const referencePriceRef = useRef<number | null>(referencePrice ?? null);
  const themeRef = useRef<ChartTheme>("dark");
  const dataRef = useRef<PricePoint[]>(data);

  const hoverCallbackRef = useRef<typeof onHoverPrice>(onHoverPrice);
  useEffect(() => {
    hoverCallbackRef.current = onHoverPrice;
  }, [onHoverPrice]);

  const hoverCandleCallbackRef = useRef<typeof onHoverCandle>(onHoverCandle);
  useEffect(() => {
    hoverCandleCallbackRef.current = onHoverCandle;
  }, [onHoverCandle]);

  useEffect(() => {
    referencePriceRef.current = referencePrice ?? null;
  }, [referencePrice]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resolvedHeight = Math.max(160, Math.round(height));
    const initialTheme = getChartTheme();
    themeRef.current = initialTheme;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: resolvedHeight,
      ...getThemeChartOptions(initialTheme),
      leftPriceScale: {
        visible: false,
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.24 },
        ticksVisible: true,
      },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.24 },
        mode: PriceScaleMode.Normal,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        ticksVisible: true,
        rightOffset: 2,
        barSpacing: 7,
        minBarSpacing: 2,
        tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) => {
          const date = toDate(time);
          if (!date) return null;

          if (tickMarkType === TickMarkType.Time) {
            return new Intl.DateTimeFormat("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone,
            }).format(date);
          }

          if (tickMarkType === TickMarkType.DayOfMonth) {
            return new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              timeZone,
            }).format(date);
          }

          if (tickMarkType === TickMarkType.Month) {
            return new Intl.DateTimeFormat("en-IN", {
              month: "short",
              year: "2-digit",
              timeZone,
            }).format(date);
          }

          if (tickMarkType === TickMarkType.Year) {
            return new Intl.DateTimeFormat("en-IN", {
              year: "numeric",
              timeZone,
            }).format(date);
          }

          // fallback
          return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone,
          }).format(date);
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisDoubleClickReset: true,
        mouseWheel: true,
        pinch: true,
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(2),
        timeFormatter: (time: UTCTimestamp) => {
          const date = new Date(Number(time) * 1000);
          if (Number.isNaN(date.getTime())) return String(time);
          return new Intl.DateTimeFormat("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone,
          }).format(date);
        },
      },
    });

    chartRef.current = chart;

    const primarySeries = createPrimarySeries(chart, variant, initialTheme);
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "volume",
      base: 0,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
      visible: false,
    });

    seriesRef.current = {
      variant,
      primarySeries,
      volumeSeries,
      referenceLine: null,
    };

    chart.subscribeCrosshairMove((param) => {
      const tooltip = tooltipRef.current;
      const tooltipPrice = tooltipPriceRef.current;
      const tooltipTime = tooltipTimeRef.current;
      const currentSeries = seriesRef.current;
      const tooltipContainer = containerRef.current;
      if (!tooltip || !tooltipPrice || !tooltipTime) return;
      if (!currentSeries || !tooltipContainer) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > tooltipContainer.clientWidth ||
        param.point.y < 0 ||
        param.point.y > tooltipContainer.clientHeight
      ) {
        tooltip.style.display = "none";
        hoverCallbackRef.current?.(null, null);
        hoverCandleCallbackRef.current?.(null, null);
        return;
      }

      const priceObj = param.seriesData.get(currentSeries.primarySeries) as
        | BarData
        | LineData
        | HistogramData
        | CustomData
        | undefined;

      let value: number | null = null;
      let candle: { open: number; high: number; low: number; close: number } | null = null;
      if (priceObj && "value" in priceObj && typeof priceObj.value === "number") {
        value = priceObj.value;
      } else if (
        priceObj &&
        "open" in priceObj &&
        "high" in priceObj &&
        "low" in priceObj &&
        "close" in priceObj &&
        typeof priceObj.open === "number" &&
        typeof priceObj.high === "number" &&
        typeof priceObj.low === "number" &&
        typeof priceObj.close === "number"
      ) {
        candle = {
          open: priceObj.open,
          high: priceObj.high,
          low: priceObj.low,
          close: priceObj.close,
        };
        value = priceObj.close;
      } else if (priceObj && "close" in priceObj && typeof priceObj.close === "number") {
        value = priceObj.close;
      }

      if (value === null) {
        tooltip.style.display = "none";
        hoverCallbackRef.current?.(null, null);
        hoverCandleCallbackRef.current?.(null, null);
        return;
      }

      let dateStr: string;
      if (typeof param.time === "number") {
        dateStr = new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone,
          timeZoneName: "short",
        }).format(new Date(param.time * 1000));
      } else {
        dateStr = String(param.time);
      }

      tooltip.style.display = "block";
      tooltipPrice.textContent = `${currencySymbol()}${value.toFixed(2)}`;
      tooltipTime.textContent = dateStr;
      hoverCallbackRef.current?.(value, dateStr);
      hoverCandleCallbackRef.current?.(candle, dateStr);

      const toolTipWidth = 160;
      const toolTipHeight = 66;
      const margin = 18;
      let left = param.point.x + margin;
      if (left + toolTipWidth > tooltipContainer.clientWidth) {
        left = param.point.x - toolTipWidth - margin;
      }
      let top = param.point.y - toolTipHeight - margin;
      if (top < margin) {
        top = param.point.y + margin;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    const observer = new ResizeObserver(() => {
      chart.resize(container.clientWidth, resolvedHeight);
    });
    observer.observe(container);
    resizeObserverRef.current = observer;

    syncChartData(chart, seriesRef.current, data, referencePrice ?? null, initialTheme, true);

    const onThemeUpdate = () => {
      const nextTheme = getChartTheme();
      themeRef.current = nextTheme;
      applyChartTheme(chart, seriesRef.current, nextTheme);
      syncChartData(chart, seriesRef.current, dataRef.current, referencePriceRef.current, nextTheme, false);
    };

    window.addEventListener("ui-theme-updated", onThemeUpdate);

    return () => {
      window.removeEventListener("ui-theme-updated", onThemeUpdate);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      seriesRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, timeZone]);

  useEffect(() => {
    const chart = chartRef.current;
    const handles = seriesRef.current;
    if (!chart || !handles) return;
    if (handles.variant === variant) return;

    const visibleLogical = chart.timeScale().getVisibleLogicalRange();
    chart.removeSeries(handles.primarySeries as unknown as ISeriesApi<"Area" | "Candlestick" | "Line", Time>);

    const theme = themeRef.current ?? getChartTheme();
    handles.primarySeries = createPrimarySeries(chart, variant, theme);
    handles.variant = variant;
    handles.referenceLine = null;

    syncChartData(chart, handles, data, referencePrice ?? null, theme, visibleLogical === null);
    if (visibleLogical) {
      chart.timeScale().setVisibleLogicalRange(visibleLogical);
    }
  }, [variant, data, referencePrice]);

  useEffect(() => {
    const chart = chartRef.current;
    const handles = seriesRef.current;
    if (!chart || !handles) return;
    const theme = themeRef.current ?? getChartTheme();

    const beforeRange = chart.timeScale().getVisibleLogicalRange();

    const nextMeta =
      data.length === 0
        ? { first: "", last: "", len: 0 }
        : { first: data[0]!.time, last: data[data.length - 1]!.time, len: data.length };
    const prevMeta = dataMetaRef.current;

    // Fit only when we load/replace a dataset (range tab change, symbol change, etc).
    const shouldFit =
      !prevMeta ||
      prevMeta.len === 0 ||
      nextMeta.len === 0 ||
      nextMeta.first !== prevMeta.first ||
      nextMeta.len < prevMeta.len;

    dataMetaRef.current = nextMeta;

    syncChartData(chart, handles, data, referencePrice ?? null, theme, shouldFit);

    // If the user is already at the right edge, keep tracking live updates without resetting zoom.
    if (!shouldFit && beforeRange) {
      const lastIndex = Math.max(0, data.length - 1);
      const distanceFromRight = lastIndex - beforeRange.to;
      if (distanceFromRight <= 2) {
        chart.timeScale().scrollToRealTime();
      }
    }
  }, [data, referencePrice]);

  return (
    <div className="relative w-full rounded-[22px]" style={{ height: Math.max(160, Math.round(height)) }}>
      <div ref={containerRef} className="h-full w-full" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-50 rounded-2xl border border-white/10 bg-[#20232d]/95 px-5 py-4 shadow-2xl backdrop-blur"
        style={{ display: "none", top: 0, left: 0 }}
      >
        <div ref={tooltipPriceRef} className="text-[18px] font-bold tracking-tight text-white" />
        <div ref={tooltipTimeRef} className="mt-1.5 text-[12px] text-white/60" />
      </div>
    </div>
  );
}

function syncChartData(
  chart: IChartApi,
  handles: SeriesHandle,
  data: PricePoint[],
  referencePrice: number | null,
  theme: ChartTheme,
  fitContent: boolean,
) {
  const normalized = normalizePricePoints(data);

  if (normalized.length === 0) {
    if (handles.variant === "candles") {
      (handles.primarySeries as ISeriesApi<"Candlestick">).setData([]);
    } else {
      (handles.primarySeries as ISeriesApi<"Area"> | ISeriesApi<"Line">).setData([]);
    }
    handles.volumeSeries.setData([]);
    updateReferenceLine(handles, null, theme);
    return;
  }

  const rows = buildChartRows(normalized);

  if (handles.variant === "candles") {
    (handles.primarySeries as ISeriesApi<"Candlestick">).setData(rows.candleData);
  } else {
    (handles.primarySeries as ISeriesApi<"Area"> | ISeriesApi<"Line">).setData(rows.lineData);
  }
  handles.volumeSeries.setData(rows.volumeData);

  updateReferenceLine(handles, referencePrice, theme);

  if (fitContent) {
    chart.timeScale().fitContent();
  }
}

function updateReferenceLine(handles: SeriesHandle, referencePrice: number | null, theme: ChartTheme) {
  if (handles.referenceLine) {
    handles.primarySeries.removePriceLine(handles.referenceLine);
    handles.referenceLine = null;
  }

  if (typeof referencePrice !== "number" || !Number.isFinite(referencePrice)) {
    return;
  }

  handles.referenceLine = handles.primarySeries.createPriceLine({
    price: referencePrice,
    color: theme === "light" ? "rgba(71, 85, 105, 0.58)" : "rgba(209, 213, 219, 0.65)",
    lineStyle: LineStyle.Dashed,
    lineWidth: 1,
    axisLabelVisible: false,
    title: "Prev close",
  });
}

function createPrimarySeries(chart: IChartApi, variant: TradingChartVariant, theme: ChartTheme): PrimarySeries {
  if (variant === "candles") {
    return chart.addSeries(CandlestickSeries, {
      upColor: "rgba(136, 227, 138, 0.98)",
      downColor: "rgba(242, 139, 130, 0.98)",
      borderVisible: false,
      wickUpColor: "rgba(136, 227, 138, 0.98)",
      wickDownColor: "rgba(242, 139, 130, 0.98)",
      wickVisible: true,
      lastValueVisible: true,
      priceLineVisible: true,
      priceFormat: { type: "price", precision: 2, minMove: 0.05 },
    });
  }

  if (variant === "line") {
    return chart.addSeries(LineSeries, {
      color: "#91ec91",
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: theme === "light" ? "#0b0d12" : "#fff",
      crosshairMarkerBackgroundColor: "#B5F2B5",
      lastValueVisible: true,
      priceLineVisible: true,
      priceFormat: { type: "price", precision: 2, minMove: 0.05 },
    });
  }

  return chart.addSeries(AreaSeries, {
    lineColor: "#91ec91",
    lineWidth: 2,
    topColor: "rgba(136, 227, 138, 0.34)",
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: theme === "light" ? "#0b0d12" : "#fff",
    crosshairMarkerBackgroundColor: "#B5F2B5",
    lastValueVisible: true,
    priceLineVisible: true,
    priceFormat: { type: "price", precision: 2, minMove: 0.05 },
  });
}

function getChartTheme(): ChartTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark";
}

function getThemeChartOptions(theme: ChartTheme) {
  if (theme === "light") {
    return {
      layout: {
        background: { color: "#ffffff" },
        textColor: "rgba(2, 6, 23, 0.62)",
        fontFamily: '"Google Sans", "Segoe UI", sans-serif',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(2, 6, 23, 0.10)" },
        horzLines: { color: "rgba(2, 6, 23, 0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(2, 6, 23, 0.20)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#f1f5f9",
        },
        horzLine: {
          visible: true,
          color: "rgba(2, 6, 23, 0.20)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#f1f5f9",
        },
      },
    } as const;
  }

  return {
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
  } as const;
}

function applyChartTheme(chart: IChartApi, handles: SeriesHandle | null, theme: ChartTheme) {
  chart.applyOptions(getThemeChartOptions(theme));

  if (!handles) return;
  if (handles.variant === "line") {
    (handles.primarySeries as ISeriesApi<"Line">).applyOptions({
      crosshairMarkerBorderColor: theme === "light" ? "#0b0d12" : "#fff",
    });
  }
  if (handles.variant === "area") {
    (handles.primarySeries as ISeriesApi<"Area">).applyOptions({
      crosshairMarkerBorderColor: theme === "light" ? "#0b0d12" : "#fff",
    });
  }
}

function buildChartRows(data: PricePoint[]) {
  const lineData = data.map((point, index) => ({
    time: toChartTime(point.time, index),
    value: point.value,
  }));

  const candleData = toCandlesFromPoints(data);

  const volumeData = data.map((point, index, rows) => {
    const previous = rows[index - 1]?.value ?? point.value;
    const delta = point.value - previous;
    return {
      time: toChartTime(point.time, index),
      value: Math.max(Math.abs(delta) * 9, 2),
      color: delta >= 0 ? "rgba(136, 227, 138, 0.42)" : "rgba(255, 150, 150, 0.36)",
    };
  });

  return { lineData, candleData, volumeData };
}

function toChartTime(time: string, index: number) {
  const parsed = Math.floor(new Date(time).getTime() / 1000);
  return (Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1) as UTCTimestamp;
}

function normalizePricePoints(data: PricePoint[]) {
  const rows = data
    .map((point, index) => {
      const timeMs = new Date(point.time).getTime();
      if (!Number.isFinite(timeMs) || timeMs <= 0) {
        return null;
      }
      if (typeof point.value !== "number" || !Number.isFinite(point.value)) {
        return null;
      }
      return {
        index,
        second: Math.floor(timeMs / 1000),
        time: point.time,
        value: point.value,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => (a.second === b.second ? a.index - b.index : a.second - b.second));

  if (rows.length <= 1) {
    return rows.map(({ time, value }) => ({ time, value }));
  }

  const result: PricePoint[] = [];
  for (const row of rows) {
    const last = result[result.length - 1];
    if (!last) {
      result.push({ time: row.time, value: row.value });
      continue;
    }

    const lastSec = Math.floor(new Date(last.time).getTime() / 1000);
    if (lastSec === row.second) {
      // overwrite duplicates within the same second (keeps series strictly ascending)
      result[result.length - 1] = { time: row.time, value: row.value };
      continue;
    }

    result.push({ time: row.time, value: row.value });
  }

  return result;
}

function toCandlesFromPoints(data: PricePoint[]) {
  const candles: Array<{ time: UTCTimestamp; open: number; high: number; low: number; close: number }> = [];
  if (data.length === 0) return candles;

  for (let i = 0; i < data.length; i++) {
    const current = data[i]!.value;
    const prev = data[i - 1]?.value ?? current;
    const open = prev;
    const close = current;
    let high = Math.max(open, close);
    let low = Math.min(open, close);

    const base = Math.max(open, close);
    const minWick = Math.max(base * 0.0006, 0.05);
    if (high - base < minWick) high = base + minWick;
    if (base - low < minWick) low = base - minWick;

    candles.push({
      time: toChartTime(data[i]!.time, i),
      open,
      high,
      low: Math.max(0, low),
      close,
    });
  }

  return candles;
}

function currencySymbol() {
  return "\u20B9";
}

function toDate(time: Time) {
  if (typeof time === "number") {
    const date = new Date(time * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (time && typeof time === "object" && "year" in time && "month" in time && "day" in time) {
    const date = new Date(Date.UTC(time.year, time.month - 1, time.day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
