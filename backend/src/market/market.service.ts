import { Inject, Injectable } from '@nestjs/common';

import { MARKET_PROVIDER } from './providers/market-provider.interface';
import type {
  FutureQuote,
  MarketDataProvider,
  MarketMover,
  MarketResearch,
  MarketSearchItem,
  ResearchInsight,
  SectorPerformance,
} from './providers/market-provider.interface';

type FuturesKind = 'stock' | 'index';

const STOCK_FUTURES_SYMBOLS = ['RELIANCE', 'SBIN', 'TCS', 'INFY', 'HDFCBANK'];
const INDEX_FUTURES_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
const MOVER_SYMBOLS = [
  'RELIANCE',
  'HDFCBANK',
  'TCS',
  'ITC',
  'SBIN',
  'INFY',
  'ONGC',
  'TATAMOTORS',
  'HCLTECH',
  'POWERGRID',
  'ICICIBANK',
  'LT',
  'BAJFINANCE',
  'BHARTIARTL',
  'AXISBANK',
  'LTIM',
  'ULTRACEMCO',
  'MARUTI',
  'TITAN',
  'ASIANPAINT',
  'ADANIPORTS',
  'NTPC',
  'KOTAKBANK',
  'BAJAJFINSV',
  'SUNPHARMA',
];
const SECTOR_BASKETS: Record<string, string[]> = {
  Auto: ['TATAMOTORS', 'BAJAJ-AUTO', 'M&M'],
  IT: ['TCS', 'INFY', 'HCLTECH'],
  Pharma: ['SUNPHARMA', 'DRREDDY', 'CIPLA'],
  Energy: ['RELIANCE', 'ONGC', 'POWERGRID'],
  Financials: ['HDFCBANK', 'ICICIBANK', 'SBIN'],
  FMCG: ['ITC', 'HINDUNILVR', 'NESTLEIND'],
};
const SYMBOL_DETAILS: Record<
  string,
  { name: string; exchange: string; sector: string; peers: string[] }
> = {
  RELIANCE: {
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    sector: 'Energy',
    peers: ['ONGC', 'POWERGRID', 'NTPC'],
  },
  HDFCBANK: {
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    sector: 'Financials',
    peers: ['ICICIBANK', 'SBIN', 'AXISBANK'],
  },
  TCS: {
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    sector: 'IT',
    peers: ['INFY', 'HCLTECH', 'LTIM'],
  },
  ITC: {
    name: 'ITC Ltd',
    exchange: 'NSE',
    sector: 'FMCG',
    peers: ['HINDUNILVR', 'NESTLEIND', 'BRITANNIA'],
  },
  SBIN: {
    name: 'State Bank of India',
    exchange: 'NSE',
    sector: 'Financials',
    peers: ['HDFCBANK', 'ICICIBANK', 'AXISBANK'],
  },
  INFY: {
    name: 'Infosys Ltd',
    exchange: 'NSE',
    sector: 'IT',
    peers: ['TCS', 'HCLTECH', 'LTIM'],
  },
  ONGC: {
    name: 'Oil and Natural Gas Corp',
    exchange: 'NSE',
    sector: 'Energy',
    peers: ['RELIANCE', 'NTPC', 'POWERGRID'],
  },
  TATAMOTORS: {
    name: 'Tata Motors Ltd',
    exchange: 'NSE',
    sector: 'Auto',
    peers: ['MARUTI', 'M&M', 'BAJAJ-AUTO'],
  },
  HCLTECH: {
    name: 'HCL Technologies',
    exchange: 'NSE',
    sector: 'IT',
    peers: ['TCS', 'INFY', 'LTIM'],
  },
  POWERGRID: {
    name: 'Power Grid Corp',
    exchange: 'NSE',
    sector: 'Energy',
    peers: ['RELIANCE', 'ONGC', 'NTPC'],
  },
  ICICIBANK: {
    name: 'ICICI Bank Ltd',
    exchange: 'NSE',
    sector: 'Financials',
    peers: ['HDFCBANK', 'SBIN', 'AXISBANK'],
  },
  AXISBANK: {
    name: 'Axis Bank Ltd',
    exchange: 'NSE',
    sector: 'Financials',
    peers: ['HDFCBANK', 'ICICIBANK', 'SBIN'],
  },
};
const SEARCH_ITEMS: MarketSearchItem[] = [
  {
    label: 'Dashboard',
    hint: 'Overview',
    route: '/dashboard',
    keywords: ['dashboard', 'home', 'overview'],
  },
  {
    label: 'Alerts',
    hint: 'Price alerts',
    route: '/dashboard/alerts',
    keywords: ['alerts', 'alert'],
  },
  {
    label: 'Watchlist',
    hint: 'Saved instruments',
    route: '/dashboard/watchlist',
    keywords: ['watchlist'],
  },
  {
    label: 'NIFTY 50',
    hint: 'Index NSE',
    route: '/dashboard/index/nse',
    keywords: ['nifty', 'index', 'nse'],
  },
  {
    label: 'NIFTY BANK',
    hint: 'Index NSE',
    route: '/dashboard/index/nse',
    keywords: ['banknifty', 'bank nifty', 'index', 'nse'],
  },
  {
    label: 'SENSEX',
    hint: 'Index BSE',
    route: '/dashboard/index/bse',
    keywords: ['sensex', 'index', 'bse'],
  },
  {
    label: 'NSE Equities',
    hint: 'Cash / Equity',
    route: '/dashboard/equity/nse',
    keywords: ['equity', 'stock', 'stocks', 'nse'],
  },
  {
    label: 'BSE Equities',
    hint: 'Cash / Equity',
    route: '/dashboard/equity/bse',
    keywords: ['equity', 'stock', 'stocks', 'bse'],
  },
  {
    label: 'Stock Futures',
    hint: 'Derivatives',
    route: '/dashboard/futures/stock',
    keywords: ['futures', 'stock futures'],
  },
  {
    label: 'Index Futures',
    hint: 'Derivatives',
    route: '/dashboard/futures/index',
    keywords: ['index futures', 'futures'],
  },
  {
    label: 'Stock Options',
    hint: 'Derivatives',
    route: '/dashboard/options/stock',
    keywords: ['options', 'stock options'],
  },
  {
    label: 'Index Options',
    hint: 'Derivatives',
    route: '/dashboard/options/index',
    keywords: ['options', 'index options'],
  },
  ...[
    'RELIANCE',
    'HDFCBANK',
    'TCS',
    'ITC',
    'SBIN',
    'INFY',
    'ONGC',
    'TATAMOTORS',
    'HCLTECH',
    'POWERGRID',
    'ICICIBANK',
    'LT',
    'BAJFINANCE',
    'BHARTIARTL',
    'AXISBANK',
    'LTIM',
    'ULTRACEMCO',
    'MARUTI',
    'TITAN',
    'ASIANPAINT',
    'ADANIPORTS',
    'NTPC',
    'KOTAKBANK',
    'BAJAJFINSV',
    'SUNPHARMA',
  ].map<MarketSearchItem>((symbol) => ({
    label: symbol,
    hint: 'NSE Equity',
    route: '/dashboard/equity/nse',
    keywords: [symbol.toLowerCase(), symbol.replace('-', ' ').toLowerCase()],
  })),
];

@Injectable()
export class MarketService {
  constructor(
    @Inject(MARKET_PROVIDER)
    private readonly provider: MarketDataProvider,
  ) {}

  getEquity(symbol: string) {
    return this.provider.getEquityQuote(symbol);
  }

  getIndex(symbol: string) {
    return this.provider.getIndexQuote(symbol);
  }

  getTimeSeries(
    kind: 'equity' | 'index',
    symbol: string,
    range?: string,
    interval?: string,
  ) {
    return this.provider.getTimeSeries(symbol, kind, range, interval);
  }

  async getMovers(): Promise<{
    gainers: MarketMover[];
    losers: MarketMover[];
  }> {
    const quotes = await Promise.allSettled(
      MOVER_SYMBOLS.map((symbol) => this.provider.getEquityQuote(symbol)),
    );

    const movers = quotes
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<
          Awaited<ReturnType<MarketDataProvider['getEquityQuote']>>
        > => result.status === 'fulfilled',
      )
      .map<MarketMover>((result) => ({
        symbol: result.value.symbol,
        name: result.value.symbol,
        ltp: result.value.price,
        changePercent: result.value.changePercent,
      }));

    return {
      gainers: [...movers]
        .sort((left, right) => right.changePercent - left.changePercent)
        .slice(0, 5),
      losers: [...movers]
        .sort((left, right) => left.changePercent - right.changePercent)
        .slice(0, 5),
    };
  }

  async getSectorPerformance(): Promise<SectorPerformance[]> {
    const sectors = await Promise.all(
      Object.entries(SECTOR_BASKETS).map(async ([name, symbols]) => {
        const quotes = await Promise.allSettled(
          symbols.map((symbol) => this.provider.getEquityQuote(symbol)),
        );
        const fulfilled = quotes
          .filter(
            (
              result,
            ): result is PromiseFulfilledResult<
              Awaited<ReturnType<MarketDataProvider['getEquityQuote']>>
            > => result.status === 'fulfilled',
          )
          .map((result) => result.value);

        if (fulfilled.length === 0) {
          return {
            name,
            performance: 0,
            leaders: symbols,
          };
        }

        const average =
          fulfilled.reduce((sum, quote) => sum + quote.changePercent, 0) /
          fulfilled.length;

        return {
          name,
          performance: Number(average.toFixed(2)),
          leaders: fulfilled.map((quote) => quote.symbol),
        };
      }),
    );

    return sectors;
  }

  search(query: string): MarketSearchItem[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return SEARCH_ITEMS.filter((item) =>
      [item.label, item.hint, ...item.keywords].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    ).slice(0, 8);
  }

  async getResearch(symbol: string): Promise<MarketResearch> {
    const normalized = symbol.toUpperCase();
    const meta = SYMBOL_DETAILS[normalized] ?? {
      name: normalized,
      exchange: 'NSE',
      sector: 'Markets',
      peers: [],
    };
    const [quote, series, oneYearSeries] = await Promise.all([
      this.provider.getEquityQuote(normalized),
      this.provider.getTimeSeries(normalized, 'equity', '1d', '30m'),
      this.provider.getTimeSeries(normalized, 'equity', '1y', '1d'),
    ]);

    const values = series.map((point) => point.value);
    const yearValues = oneYearSeries.map((point) => point.value);
    const first = values[0] ?? quote.price;
    const last = values.at(-1) ?? quote.price;
    const support = Number(Math.min(...values, quote.dayLow).toFixed(2));
    const resistance = Number(Math.max(...values, quote.dayHigh).toFixed(2));
    const yearHigh = Number(Math.max(...yearValues, quote.dayHigh).toFixed(2));
    const yearLow = Number(Math.min(...yearValues, quote.dayLow).toFixed(2));
    const momentum =
      first === 0 ? 0 : Number((((last - first) / first) * 100).toFixed(2));
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
      Math.max(values.length, 1);
    const volatility = Number(Math.sqrt(variance).toFixed(2));
    const stance = this.getStance(quote.changePercent, momentum);

    return {
      symbol: normalized,
      name: meta.name,
      exchange: meta.exchange,
      sector: meta.sector,
      stance,
      summary: this.buildSummary(meta.name, meta.sector, quote.changePercent, momentum),
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      open: quote.open,
      previousClose: quote.previousClose,
      volume: quote.volume,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      yearHigh,
      yearLow,
      support,
      resistance,
      momentum,
      volatility,
      timestamp: quote.timestamp,
      peers: meta.peers,
      bullishPoints: this.buildBullishPoints(quote, momentum, support),
      riskPoints: this.buildRiskPoints(quote, momentum, resistance, volatility),
    };
  }

  async getFutures(kind: FuturesKind): Promise<FutureQuote[]> {
    const symbols =
      kind === 'stock' ? STOCK_FUTURES_SYMBOLS : INDEX_FUTURES_SYMBOLS;

    if (kind === 'stock') {
      const quotes = await Promise.all(
        symbols.map((symbol) => this.provider.getEquityQuote(symbol)),
      );

      return quotes.map((quote, index) =>
        this.toFutureQuote(quote.symbol, quote.price, quote.changePercent, {
          kind,
          timestamp: quote.timestamp,
          seed: index,
        }),
      );
    }

    const quotes = await Promise.all(
      symbols.map((symbol) => this.provider.getIndexQuote(symbol)),
    );

    return quotes.map((quote, index) =>
      this.toFutureQuote(quote.symbol, quote.price, quote.changePercent, {
        kind,
        timestamp: quote.timestamp,
        seed: index,
      }),
    );
  }

  private toFutureQuote(
    symbol: string,
    spotPrice: number,
    changePercent: number,
    input: { kind: FuturesKind; timestamp: string; seed: number },
  ): FutureQuote {
    const expiry = this.getMonthlyExpiryLabel(new Date());
    const basisMultiplier = input.kind === 'index' ? 0.0019 : 0.0028;
    const signedBasis =
      spotPrice * basisMultiplier * (input.seed % 2 === 0 ? 1 : -1);
    const futurePrice = Number((spotPrice + signedBasis).toFixed(2));
    const change = Number(((futurePrice * changePercent) / 100).toFixed(2));
    const openInterestBase = input.kind === 'index' ? 420000 : 145000;
    const volumeBase = input.kind === 'index' ? 91000 : 64000;

    return {
      symbol,
      contract: `${symbol} ${expiry} FUT`,
      underlyingType: input.kind,
      expiry,
      price: futurePrice,
      change,
      changePercent: Number(changePercent.toFixed(2)),
      openInterest: openInterestBase + input.seed * 87320,
      volume: volumeBase + input.seed * 15480,
      basis: Number(signedBasis.toFixed(2)),
      timestamp: input.timestamp,
    };
  }

  private getMonthlyExpiryLabel(date: Date) {
    return date
      .toLocaleString('en-US', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
      })
      .replace(' ', ' ')
      .toUpperCase();
  }

  private getStance(changePercent: number, momentum: number) {
    if (changePercent > 1 && momentum > 0.5) {
      return 'Bullish' as const;
    }
    if (changePercent < -1 && momentum < -0.5) {
      return 'Cautious' as const;
    }
    return 'Neutral' as const;
  }

  private buildSummary(
    name: string,
    sector: string,
    changePercent: number,
    momentum: number,
  ) {
    const intradayTone =
      changePercent >= 0 ? 'holding positive intraday breadth' : 'trading with intraday pressure';
    const momentumTone =
      momentum >= 0 ? 'Recent momentum remains constructive.' : 'Recent momentum is mixed.';

    return `${name} in ${sector} is ${intradayTone}. ${momentumTone}`;
  }

  private buildBullishPoints(
    quote: Awaited<ReturnType<MarketDataProvider['getEquityQuote']>>,
    momentum: number,
    support: number,
  ): ResearchInsight[] {
    return [
      {
        title: 'Price Above Support',
        detail: `Spot is holding above the near-term support zone around ₹${support.toFixed(2)}.`,
      },
      {
        title: 'Momentum Profile',
        detail: `Intraday momentum is ${momentum >= 0 ? 'positive' : 'recovering'} at ${momentum.toFixed(2)}%.`,
      },
      {
        title: 'Participation',
        detail: `Volume is running at ${Intl.NumberFormat('en-IN').format(quote.volume)}, supporting active price discovery.`,
      },
    ];
  }

  private buildRiskPoints(
    quote: Awaited<ReturnType<MarketDataProvider['getEquityQuote']>>,
    momentum: number,
    resistance: number,
    volatility: number,
  ): ResearchInsight[] {
    return [
      {
        title: 'Resistance Overhead',
        detail: `A clean move above ₹${resistance.toFixed(2)} is still needed to confirm strength.`,
      },
      {
        title: 'Range Sensitivity',
        detail: `Day range is ₹${quote.dayLow.toFixed(2)} to ₹${quote.dayHigh.toFixed(2)}, so reversals remain possible.`,
      },
      {
        title: 'Volatility Check',
        detail: `Observed intraday volatility is ${volatility.toFixed(2)} with momentum at ${momentum.toFixed(2)}%, so sizing discipline matters.`,
      },
    ];
  }
}
