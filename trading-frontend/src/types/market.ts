export type Trend = "up" | "down" | "flat";

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface PricePoint {
  time: string;
  value: number;
}

export interface FutureContract {
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

export interface SectorCard {
  name: string;
  performance: number;
  leaders?: string[];
}

export interface GainerLoserItem {
  symbol: string;
  name: string;
  ltp: number;
  changePercent: number;
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
  stance: "Bullish" | "Neutral" | "Cautious";
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
