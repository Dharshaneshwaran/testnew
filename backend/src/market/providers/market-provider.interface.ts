export interface EquityQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
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

export interface MarketDataProvider {
  getEquityQuote(symbol: string): Promise<EquityQuote>;
  getIndexQuote(symbol: string): Promise<IndexQuote>;
}

export const MARKET_PROVIDER = 'MARKET_PROVIDER';
