import { GainerLoserItem, PricePoint, SectorCard, Ticker } from "@/types/market";

export const topTickers: Ticker[] = [
  { symbol: "NIFTY", name: "NIFTY 50", price: 22784.4, change: 146.25, changePercent: 0.65 },
  { symbol: "SENSEX", name: "BSE SENSEX", price: 74918.2, change: 402.11, changePercent: 0.54 },
  { symbol: "BANKNIFTY", name: "NIFTY BANK", price: 48764.95, change: -124.4, changePercent: -0.25 },
];

export const selectedStock = {
  symbol: "RELIANCE",
  name: "Reliance Industries Ltd.",
  price: 2948.2,
  change: 31.5,
  changePercent: 1.08,
  volume: "8.42M",
  dayRange: "2910.00 - 2962.80",
  marketCap: "₹19.95T",
};

export const chartPoints: PricePoint[] = [
  { time: "09:15", value: 2916 },
  { time: "09:45", value: 2928 },
  { time: "10:15", value: 2939 },
  { time: "10:45", value: 2930 },
  { time: "11:15", value: 2944 },
  { time: "11:45", value: 2953 },
  { time: "12:15", value: 2948 },
  { time: "12:45", value: 2959 },
  { time: "13:15", value: 2962 },
  { time: "13:45", value: 2954 },
  { time: "14:15", value: 2945 },
  { time: "14:45", value: 2948 },
  { time: "15:15", value: 2948.2 },
];

export const sectorCards: SectorCard[] = [
  { name: "Auto", performance: 1.24 },
  { name: "IT", performance: -0.86 },
  { name: "Pharma", performance: 0.45 },
  { name: "Energy", performance: 1.12 },
  { name: "Financials", performance: -0.34 },
  { name: "FMCG", performance: 0.28 },
];

export const topGainers: GainerLoserItem[] = [
  { symbol: "TATAMOTORS", name: "Tata Motors", ltp: 1001.4, changePercent: 4.42 },
  { symbol: "SBIN", name: "State Bank of India", ltp: 819.8, changePercent: 2.81 },
  { symbol: "ONGC", name: "ONGC", ltp: 284.2, changePercent: 2.34 },
  { symbol: "HCLTECH", name: "HCL Technologies", ltp: 1739.1, changePercent: 2.06 },
  { symbol: "POWERGRID", name: "Power Grid Corp", ltp: 314.7, changePercent: 1.88 },
];

export const topLosers: GainerLoserItem[] = [
  { symbol: "INFY", name: "Infosys", ltp: 1512.3, changePercent: -2.74 },
  { symbol: "WIPRO", name: "Wipro", ltp: 521.1, changePercent: -2.16 },
  { symbol: "AXISBANK", name: "Axis Bank", ltp: 1098.4, changePercent: -1.65 },
  { symbol: "ICICIGI", name: "ICICI Lombard", ltp: 1686.9, changePercent: -1.38 },
  { symbol: "TCS", name: "Tata Consultancy Services", ltp: 3948.4, changePercent: -1.22 },
];

export const miniSparklineData = {
  NIFTY: [22120, 22190, 22230, 22310, 22360, 22440, 22520, 22580, 22610, 22784],
  SENSEX: [73600, 73820, 74000, 74230, 74420, 74610, 74790, 74820, 74880, 74918],
  BANKNIFTY: [49380, 49220, 49150, 49040, 48990, 48850, 48820, 48790, 48720, 48765],
};
