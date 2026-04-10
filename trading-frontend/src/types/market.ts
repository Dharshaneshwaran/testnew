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

export interface SectorCard {
  name: string;
  performance: number;
}

export interface GainerLoserItem {
  symbol: string;
  name: string;
  ltp: number;
  changePercent: number;
}
