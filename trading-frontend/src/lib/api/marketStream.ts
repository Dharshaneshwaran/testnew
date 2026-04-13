import { API_BASE_URL } from "@/lib/api/client";

export type MarketStreamKind = "equity" | "index";

export type MarketStreamQuote = {
  type: "quote";
  kind: MarketStreamKind;
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  open?: number;
  previousClose?: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  high?: number;
  low?: number;
  timestamp: string;
};

export type MarketStreamError = {
  type: "error";
  message: string;
  timestamp: string;
};

export type MarketStreamMessage = MarketStreamQuote | MarketStreamError;

export function openMarketStream(input: {
  kind: MarketStreamKind;
  symbol: string;
  intervalMs?: number;
}) {
  const url = new URL(
    `/market/stream/${encodeURIComponent(input.kind)}/${encodeURIComponent(input.symbol)}`,
    API_BASE_URL,
  );
  if (typeof input.intervalMs === "number" && Number.isFinite(input.intervalMs)) {
    url.searchParams.set("intervalMs", String(Math.round(input.intervalMs)));
  }
  return new EventSource(url.toString());
}

export type FuturesStreamKind = "stock" | "index";

export type FuturesStreamQuote = {
  type: "future";
  kind: FuturesStreamKind;
  symbol: string;
  contract: string;
  underlyingType: "stock" | "index";
  expiry: string;
  price: number;
  change: number;
  changePercent: number;
  openInterest: number;
  volume: number;
  basis: number;
  timestamp: string;
};

export type FuturesStreamMessage = FuturesStreamQuote | MarketStreamError;

export function openFuturesStream(input: {
  kind: FuturesStreamKind;
  symbol: string;
  intervalMs?: number;
}) {
  const url = new URL(
    `/market/stream/futures/${encodeURIComponent(input.kind)}/${encodeURIComponent(input.symbol)}`,
    API_BASE_URL,
  );
  if (typeof input.intervalMs === "number" && Number.isFinite(input.intervalMs)) {
    url.searchParams.set("intervalMs", String(Math.round(input.intervalMs)));
  }
  return new EventSource(url.toString());
}
