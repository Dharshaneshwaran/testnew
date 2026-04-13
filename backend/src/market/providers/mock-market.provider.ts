import { Injectable } from '@nestjs/common';

import {
  EquityQuote,
  IndexQuote,
  MarketDataProvider,
  TimeSeriesPoint,
} from './market-provider.interface';

@Injectable()
export class MockMarketProvider implements MarketDataProvider {
  getEquityQuote(symbol: string): Promise<EquityQuote> {
    return Promise.resolve({
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: 2948.2,
      change: 31.5,
      changePercent: 1.08,
      open: 2922.4,
      previousClose: 2916.7,
      volume: 8420000,
      dayHigh: 2962.8,
      dayLow: 2910.0,
      timestamp: new Date().toISOString(),
    });
  }

  getIndexQuote(symbol: string): Promise<IndexQuote> {
    return Promise.resolve({
      symbol: symbol.toUpperCase(),
      price: symbol.toUpperCase() === 'SENSEX' ? 74918.2 : 22784.4,
      change: symbol.toUpperCase() === 'SENSEX' ? 402.11 : 146.25,
      changePercent: symbol.toUpperCase() === 'SENSEX' ? 0.54 : 0.65,
      open: symbol.toUpperCase() === 'SENSEX' ? 74590.3 : 22640.1,
      high: symbol.toUpperCase() === 'SENSEX' ? 75011.6 : 22815.5,
      low: symbol.toUpperCase() === 'SENSEX' ? 74480.5 : 22589.2,
      timestamp: new Date().toISOString(),
    });
  }

  async getTimeSeries(
    symbol: string,
    kind: 'equity' | 'index',
    _range = '1d',
    _interval = '30m',
  ): Promise<TimeSeriesPoint[]> {
    void _range;
    void _interval;
    const quote =
      kind === 'index'
        ? await this.getIndexQuote(symbol)
        : await this.getEquityQuote(symbol);
    const basePrice = quote.price;
    const points = 12;
    const now = Date.now();

    return Array.from({ length: points }, (_, index) => ({
      time: new Date(now - (points - index) * 30 * 60 * 1000).toISOString(),
      value: Number(
        (
          basePrice +
          Math.sin(index / 1.7) * (basePrice * 0.003) +
          (index - points / 2) * (basePrice * 0.0007)
        ).toFixed(2),
      ),
    }));
  }
}
