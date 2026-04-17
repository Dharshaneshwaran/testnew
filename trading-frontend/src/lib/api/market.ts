import { apiRequest } from '@/lib/api/client';
import {
  FutureContract,
  GainerLoserItem,
  MarketResearch,
  PricePoint,
  SectorCard,
  Ticker,
} from '@/types/market';

const ENABLE_MARKET_MOCKS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ENABLE_MARKET_MOCKS === "true";

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
  symbol?: string;
}

export async function getEquityQuote(symbol: string) {
  try {
    return await apiRequest<EquityQuote>(`/market/equity/${encodeURIComponent(symbol)}`);
  } catch (e) {
    if (!ENABLE_MARKET_MOCKS) {
      throw e;
    }
    return {
      symbol, name: `${symbol} Limited`, price: 2500, change: 15.4, changePercent: 0.62,
      open: 2490, previousClose: 2484.6, volume: 1500000, dayHigh: 2515, dayLow: 2480,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getIndexQuote(symbol: string) {
  try {
    return await apiRequest<IndexQuote>(`/market/index/${encodeURIComponent(symbol)}`);
  } catch (e) {
    if (!ENABLE_MARKET_MOCKS) {
      throw e;
    }
    const base = symbol === "NIFTY" ? 22000 : symbol === "SENSEX" ? 72000 : 47000;
    return {
      symbol, price: base + Math.random() * 100, change: 120.5, changePercent: 0.55,
      open: base - 50, high: base + 150, low: base - 100, timestamp: new Date().toISOString(),
    };
  }
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

export function getFuture(kind: "stock" | "index", symbol: string) {
  return apiRequest<FutureContract>(
    `/market/futures/${encodeURIComponent(kind)}/${encodeURIComponent(symbol)}`,
  );
}

export async function getTimeSeries(
  kind: "equity" | "index" | "stock",
  symbol: string,
  query: TimeSeriesQuery = {},
) {
  try {
    const params = new URLSearchParams();
    if (query.range) {
      params.set("range", query.range);
    }
    if (query.interval) {
      params.set("interval", query.interval);
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    return await apiRequest<PricePoint[]>(
      `/market/timeseries/${encodeURIComponent(kind)}/${encodeURIComponent(symbol)}${suffix}`,
    );
  } catch (e) {
    if (!ENABLE_MARKET_MOCKS) {
      throw e;
    }
    const points: PricePoint[] = [];
    const now = new Date();
    let val = 500;
    for (let i = 20; i >= 0; i--) {
      points.push({ time: new Date(now.getTime() - i * 3600000).toISOString(), value: val });
      val += (Math.random() * 10 - 5);
    }
    return points;
  }
}

export async function getMovers() {
  try {
    return await apiRequest<MoversResponse>('/market/movers');
  } catch (e) {
    if (!ENABLE_MARKET_MOCKS) {
      throw e;
    }
    return {
      gainers: [
        { symbol: "ASIANPAINT", name: "Asian Paints Limited", ltp: 2360.70, change: 91.2, changePercent: 4.01 },
        { symbol: "ICICIBANK", name: "ICICI Bank Ltd", ltp: 1321.90, change: 40.5, changePercent: 3.17 },
        { symbol: "TATAMOTORS", name: "Tata Motors Ltd", ltp: 342.60, change: 9.4, changePercent: 2.81 },
        { symbol: "SBIN", name: "State Bank of India", ltp: 1066.70, change: 25.4, changePercent: 2.47 }
      ],
      losers: [
        { symbol: "WIPRO", name: "Wipro Limited", ltp: 450.1, change: -12.4, changePercent: -2.6 },
        { symbol: "INFY", name: "Infosys Limited", ltp: 1600.5, change: -30.5, changePercent: -1.9 }
      ]
    };
  }
}

export async function getSectors() {
  try {
    const sectors = await apiRequest<SectorResponse[]>('/market/sectors');
    return sectors.map<SectorCard>((sector) => ({
      name: sector.name,
      performance: sector.performance,
      leaders: sector.leaders,
    }));
  } catch (e) {
    if (!ENABLE_MARKET_MOCKS) {
      throw e;
    }
    return [
      { name: "IT", performance: 1.2, leaders: ["TCS", "INFY"] },
      { name: "Banking", performance: -0.5, leaders: ["HDFCBANK", "ICICIBANK"] },
      { name: "Auto", performance: 2.4, leaders: ["TATAMOTORS", "MARUTI"] }
    ];
  }
}

export async function searchMarket(query: string) {
  const params = new URLSearchParams({ q: query });
  let results: MarketSearchItem[] = [];
  try {
    results = await apiRequest<MarketSearchItem[]>(`/market/search?${params.toString()}`);
  } catch (error) {
    results = [];
  }

  if (ENABLE_MARKET_MOCKS) {
    const missingStocks = ["ZOMATO", "ITC", "ADANIENT", "AXISBANK"];
    if (results.length === 0 && query.trim().length > 0) {
      const qUpper = query.toUpperCase();
      const matches = missingStocks.filter((stock) => stock.includes(qUpper));
      results = matches.map((stock) => ({
        label: stock,
        hint: "Equity",
        route: `/dashboard/symbol/${stock}`,
        keywords: [stock],
        symbol: stock,
      }));
    }
  }

  // Add symbol mapping for indices
  const symbolMap: Record<string, string> = {
    "NIFTY 50": "NIFTY",
    "BSE SENSEX": "SENSEX",
    "NIFTY BANK": "BANKNIFTY",
  };

  return results.map((item) => {
    const isDerivativesRoute =
      item.route.startsWith("/dashboard/futures") || item.route.startsWith("/dashboard/options");

    if (!isDerivativesRoute && (item.hint.includes("Equity") || item.hint.includes("Index"))) {
      const resolvedSymbol = symbolMap[item.label] || item.symbol || item.label;
      return { 
        ...item, 
        route: `/dashboard/symbol/${encodeURIComponent(resolvedSymbol)}`,
        symbol: resolvedSymbol,
      };
    }
    return item;
  });
}

export async function getFutureTimeSeries(
  kind: "stock" | "index",
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
    `/market/timeseries/futures/${encodeURIComponent(kind)}/${encodeURIComponent(symbol)}${suffix}`,
  );
}

export async function getResearch(symbol: string) {
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
