import { PricePoint } from "./market";

export interface WatchlistItemType {
  symbol: string;
  exchange: "NSE" | "BSE";
  ltp: number;
  change: number;
  changePercent: number;
  sparkline?: PricePoint[];
}

export interface WatchlistFolderType {
  id: string;
  name: string;
  items: WatchlistItemType[];
}
