export interface WatchlistItemType {
  symbol: string;
  exchange: "NSE" | "BSE";
  ltp: number;
  change: number;
  changePercent: number;
}

export interface WatchlistFolderType {
  id: string;
  name: string;
  items: WatchlistItemType[];
}
