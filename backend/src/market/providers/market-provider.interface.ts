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

export interface FutureQuote {
  symbol: string;
  contract: string;
  underlyingType: 'stock' | 'index';
  expiry: string;
  price: number;
  change: number;
  changePercent: number;
  openInterest: number;
  volume: number;
  basis: number;
  timestamp: string;
}

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  ltp: number;
  changePercent: number;
}

export interface SectorPerformance {
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

export interface ResearchInsight {
  title: string;
  detail: string;
}

export interface MarketResearch {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  stance: 'Bullish' | 'Neutral' | 'Cautious';
  summary: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  previousClose: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  support: number;
  resistance: number;
  momentum: number;
  volatility: number;
  timestamp: string;
  peers: string[];
  bullishPoints: ResearchInsight[];
  riskPoints: ResearchInsight[];
}

export interface MarketDataProvider {
  getEquityQuote(symbol: string): Promise<EquityQuote>;
  getIndexQuote(symbol: string): Promise<IndexQuote>;
  getTimeSeries(
    symbol: string,
    kind: 'equity' | 'index',
    range?: string,
    interval?: string,
  ): Promise<TimeSeriesPoint[]>;
}

export const MARKET_PROVIDER = 'MARKET_PROVIDER';
