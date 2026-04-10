import { ExpiryItem, OptionChainRow } from "@/types/option";

export const optionExpiries: ExpiryItem[] = [
  { label: "18 Apr 2026", value: "2026-04-18" },
  { label: "25 Apr 2026", value: "2026-04-25" },
  { label: "30 May 2026", value: "2026-05-30" },
];

export const optionChainRows: OptionChainRow[] = [
  {
    strike: 22400,
    ce: { oi: 145200, iv: 13.8, volume: 26430, ltp: 262.4, change: 14.2 },
    pe: { oi: 188100, iv: 14.4, volume: 31200, ltp: 42.8, change: -6.1 },
  },
  {
    strike: 22500,
    ce: { oi: 173440, iv: 13.2, volume: 38920, ltp: 195.6, change: 10.4 },
    pe: { oi: 211900, iv: 15.2, volume: 37650, ltp: 58.9, change: -4.2 },
  },
  {
    strike: 22600,
    ce: { oi: 201800, iv: 12.7, volume: 46290, ltp: 138.2, change: 8.6 },
    pe: { oi: 239400, iv: 16.1, volume: 42320, ltp: 79.4, change: -2.7 },
  },
  {
    strike: 22700,
    ce: { oi: 238260, iv: 12.1, volume: 53180, ltp: 95.4, change: 6.1 },
    pe: { oi: 278660, iv: 16.9, volume: 47510, ltp: 109.6, change: 1.4 },
  },
  {
    strike: 22800,
    ce: { oi: 268940, iv: 11.8, volume: 58700, ltp: 64.8, change: 3.8 },
    pe: { oi: 309420, iv: 17.8, volume: 52130, ltp: 147.9, change: 6.8 },
  },
  {
    strike: 22900,
    ce: { oi: 295780, iv: 11.2, volume: 61240, ltp: 41.5, change: 1.6 },
    pe: { oi: 331280, iv: 18.6, volume: 55640, ltp: 196.2, change: 12.5 },
  },
  {
    strike: 23000,
    ce: { oi: 317620, iv: 10.9, volume: 64080, ltp: 28.3, change: 0.9 },
    pe: { oi: 348540, iv: 19.5, volume: 59020, ltp: 248.6, change: 19.3 },
  },
];
