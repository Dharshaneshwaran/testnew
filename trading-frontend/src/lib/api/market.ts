import { apiRequest } from '@/lib/api/client';
import {
  FutureContract,
  GainerLoserItem,
  MarketResearch,
  PricePoint,
  SectorCard,
  Ticker,
} from '@/types/market';

export interface EquityQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  previousClose: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  timestamp: string;
}

export interface IndexQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  timestamp: string;
}

export interface FuturesQuote {
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
}

export interface TimeSeriesQuery {
  range?: string;
  interval?: string;
}

interface MoversResponse {
  gainers: GainerLoserItem[];
  losers: GainerLoserItem[];
}

interface SectorResponse {
  name: string;
  performance: number;
  leaders: string[];
}

export interface MarketSearchItem {
  label: string;
  hint: string;
  route: string;
  keywords: string[];
}

export function getEquityQuote(symbol: string) {
  return apiRequest<EquityQuote>(`/market/equity/${encodeURIComponent(symbol)}`);
}

export function getIndexQuote(symbol: string) {
  return apiRequest<IndexQuote>(`/market/index/${encodeURIComponent(symbol)}`);
}

export async function getEquityQuotes(symbols: string[]) {
  return Promise.all(symbols.map((symbol) => getEquityQuote(symbol)));
}

export async function getIndexQuotes(symbols: string[]) {
  return Promise.all(symbols.map((symbol) => getIndexQuote(symbol)));
}

export function getFutures(kind: "stock" | "index") {
  return apiRequest<FutureContract[]>(`/market/futures/${encodeURIComponent(kind)}`);
}

export function getTimeSeries(
  kind: "equity" | "index" | "stock",
  symbol: string,
  query: TimeSeriesQuery = {},
) {
  const params = new URLSearchParams();
  if (query.range) {
    params.set("range", query.range);
  }
  if (query.interval) {
    params.set("interval", query.interval);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<PricePoint[]>(
    `/market/timeseries/${encodeURIComponent(kind)}/${encodeURIComponent(symbol)}${suffix}`,
  );
}

export function getMovers() {
  return apiRequest<MoversResponse>('/market/movers');
}

export async function getSectors() {
  const sectors = await apiRequest<SectorResponse[]>('/market/sectors');
  return sectors.map<SectorCard>((sector) => ({
    name: sector.name,
    performance: sector.performance,
    leaders: sector.leaders,
  }));
}

export function searchMarket(query: string) {
  const params = new URLSearchParams({ q: query });
  return apiRequest<MarketSearchItem[]>(`/market/search?${params.toString()}`);
}

export function getResearch(symbol: string) {
  return apiRequest<MarketResearch>(`/market/research/${encodeURIComponent(symbol)}`);
}

export function toTicker(quote: IndexQuote, displayName: string): Ticker {
  return {
    symbol: quote.symbol,
    name: displayName,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
  };
}
