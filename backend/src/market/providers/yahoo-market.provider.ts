import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  EquityQuote,
  IndexQuote,
  MarketDataProvider,
  TimeSeriesPoint,
} from './market-provider.interface';

interface YahooQuoteResult {
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketTime?: number;
  shortName?: string;
  symbol?: string;
}

interface YahooQuoteResponse {
  quoteResponse?: {
    result?: YahooQuoteResult[];
  };
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketVolume?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketOpen?: number;
        regularMarketTime?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          volume?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          open?: Array<number | null>;
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}

type YahooChartResult = NonNullable<
  NonNullable<YahooChartResponse['chart']>['result']
>[number];

const EQUITY_SYMBOL_MAP: Record<string, string> = {
  RELIANCE: 'RELIANCE.NS',
  HDFCBANK: 'HDFCBANK.NS',
  TCS: 'TCS.NS',
  ITC: 'ITC.NS',
  SBIN: 'SBIN.NS',
  INFY: 'INFY.NS',
  ONGC: 'ONGC.NS',
  TATAMOTORS: 'TMPV.NS',
  HCLTECH: 'HCLTECH.NS',
  POWERGRID: 'POWERGRID.NS',
};

const INDEX_SYMBOL_MAP: Record<string, string> = {
  NIFTY: '^NSEI',
  SENSEX: '^BSESN',
  BANKNIFTY: '^NSEBANK',
};

@Injectable()
export class YahooMarketProvider implements MarketDataProvider {
  private readonly baseUrl =
    process.env.YAHOO_FINANCE_BASE_URL?.trim() ||
    'https://query1.finance.yahoo.com';

  async getEquityQuote(symbol: string): Promise<EquityQuote> {
    const normalizedSymbol = symbol.toUpperCase();
    const yahooSymbol = 
      EQUITY_SYMBOL_MAP[normalizedSymbol] ?? 
      INDEX_SYMBOL_MAP[normalizedSymbol] ?? 
      `${normalizedSymbol}.NS`;

    const chart = await this.fetchChart(
      yahooSymbol,
      '1d',
      '1d',
    );
    const price = chart.meta?.regularMarketPrice ?? this.getLastClose(chart) ?? 0;
    const previousClose =
      chart.meta?.previousClose ?? chart.meta?.chartPreviousClose ?? price;
    const change = Number((price - previousClose).toFixed(2));
    const changePercent =
      previousClose === 0 ? 0 : Number(((change / previousClose) * 100).toFixed(2));

    return {
      symbol: normalizedSymbol,
      name: normalizedSymbol,
      price,
      change,
      changePercent,
      open: chart.meta?.regularMarketOpen ?? this.getFirstOpen(chart) ?? previousClose,
      previousClose,
      volume: chart.meta?.regularMarketVolume ?? this.getLastVolume(chart) ?? 0,
      dayHigh: chart.meta?.regularMarketDayHigh ?? this.getMaxHigh(chart) ?? price,
      dayLow: chart.meta?.regularMarketDayLow ?? this.getMinLow(chart) ?? price,
      timestamp: this.toIsoString(chart.meta?.regularMarketTime),
    };
  }

  async getIndexQuote(symbol: string): Promise<IndexQuote> {
    const normalizedSymbol = symbol.toUpperCase();
    const chart = await this.fetchChart(
      INDEX_SYMBOL_MAP[normalizedSymbol] ?? normalizedSymbol,
      '1d',
      '1d',
    );
    const price = chart.meta?.regularMarketPrice ?? this.getLastClose(chart) ?? 0;
    const previousClose =
      chart.meta?.previousClose ?? chart.meta?.chartPreviousClose ?? price;
    const change = Number((price - previousClose).toFixed(2));
    const changePercent =
      previousClose === 0 ? 0 : Number(((change / previousClose) * 100).toFixed(2));
    const open = chart.meta?.regularMarketOpen ?? this.getFirstOpen(chart) ?? price;
    const high = chart.meta?.regularMarketDayHigh ?? this.getMaxHigh(chart) ?? price;
    const low = chart.meta?.regularMarketDayLow ?? this.getMinLow(chart) ?? price;

    return {
      symbol: normalizedSymbol,
      price,
      change,
      changePercent,
      open,
      high,
      low,
      timestamp: this.toIsoString(chart.meta?.regularMarketTime),
    };
  }

  async getTimeSeries(
    symbol: string,
    kind: 'equity' | 'index',
    range = '1d',
    interval = '30m',
  ): Promise<TimeSeriesPoint[]> {
    const normalizedSymbol = symbol.toUpperCase();
    const yahooSymbol =
      kind === 'index'
        ? INDEX_SYMBOL_MAP[normalizedSymbol] ?? normalizedSymbol
        : EQUITY_SYMBOL_MAP[normalizedSymbol] ?? `${normalizedSymbol}.NS`;
    const result = await this.fetchChart(yahooSymbol, range, interval);
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const points = timestamps
      .map((timestamp, index) => {
        const value = closes[index];
        if (typeof value !== 'number') {
          return null;
        }

        return {
          time: new Date(timestamp * 1000).toISOString(),
          value: Number(value.toFixed(2)),
        };
      })
      .filter((point): point is TimeSeriesPoint => point !== null);

    if (points.length === 0) {
      throw new InternalServerErrorException(
        `Yahoo provider returned no chart data for ${yahooSymbol}`,
      );
    }

    return points;
  }

  private async fetchChart(
    yahooSymbol: string,
    range: string,
    interval: string,
  ) {
    const url = new URL(`/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`, this.baseUrl);
    url.searchParams.set('range', range);
    url.searchParams.set('interval', interval);
    url.searchParams.set('includePrePost', 'false');

    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://finance.yahoo.com/',
          'User-Agent': 'Mozilla/5.0',
        },
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Yahoo chart request failed for ${yahooSymbol}`,
        { cause: error as Error },
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Yahoo chart request returned ${response.status} for ${yahooSymbol}`,
      );
    }

    const payload = (await response.json()) as YahooChartResponse;
    const result = payload.chart?.result?.[0];
    if (!result) {
      throw new InternalServerErrorException(
        `Yahoo provider returned no chart payload for ${yahooSymbol}`,
      );
    }

    return result;
  }

  private getLastClose(chart: YahooChartResult) {
    const closes = chart.indicators?.quote?.[0]?.close ?? [];
    return [...closes].reverse().find((value): value is number => typeof value === 'number');
  }

  private getLastVolume(chart: YahooChartResult) {
    const volumes = chart.indicators?.quote?.[0]?.volume ?? [];
    return [...volumes].reverse().find((value): value is number => typeof value === 'number');
  }

  private getMaxHigh(chart: YahooChartResult) {
    const values = (chart.indicators?.quote?.[0]?.high ?? []).filter(
      (value): value is number => typeof value === 'number',
    );
    return values.length > 0 ? Math.max(...values) : undefined;
  }

  private getMinLow(chart: YahooChartResult) {
    const values = (chart.indicators?.quote?.[0]?.low ?? []).filter(
      (value): value is number => typeof value === 'number',
    );
    return values.length > 0 ? Math.min(...values) : undefined;
  }

  private getFirstOpen(chart: YahooChartResult) {
    return (chart.indicators?.quote?.[0]?.open ?? []).find(
      (value): value is number => typeof value === 'number',
    );
  }

  private toIsoString(epochSeconds?: number) {
    return new Date((epochSeconds ?? Date.now() / 1000) * 1000).toISOString();
  }
}
