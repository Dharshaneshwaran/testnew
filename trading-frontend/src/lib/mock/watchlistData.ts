import { WatchlistFolderType } from "@/types/watchlist";

export const watchlistFolders: WatchlistFolderType[] = [
  {
    id: "wl-core",
    name: "Core",
    items: [
      { symbol: "RELIANCE", exchange: "NSE", ltp: 2948.2, change: 31.5, changePercent: 1.08 },
      { symbol: "HDFCBANK", exchange: "NSE", ltp: 1731.4, change: -7.4, changePercent: -0.43 },
      { symbol: "TCS", exchange: "NSE", ltp: 3948.4, change: -49.1, changePercent: -1.22 },
      { symbol: "ITC", exchange: "NSE", ltp: 450.7, change: 5.2, changePercent: 1.17 },
    ],
  },
  {
    id: "wl-momentum",
    name: "Momentum",
    items: [
      { symbol: "TATAMOTORS", exchange: "NSE", ltp: 1001.4, change: 42.4, changePercent: 4.42 },
      { symbol: "SBIN", exchange: "NSE", ltp: 819.8, change: 22.4, changePercent: 2.81 },
      { symbol: "ONGC", exchange: "NSE", ltp: 284.2, change: 6.5, changePercent: 2.34 },
    ],
  },
];
