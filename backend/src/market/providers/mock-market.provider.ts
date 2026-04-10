import { Injectable } from '@nestjs/common';

import {
  EquityQuote,
  IndexQuote,
  MarketDataProvider,
} from './market-provider.interface';

@Injectable()
export class MockMarketProvider implements MarketDataProvider {
  getEquityQuote(symbol: string): Promise<EquityQuote> {
    return Promise.resolve({
      symbol: symbol.toUpperCase(),
      price: 2948.2,
      change: 31.5,
      changePercent: 1.08,
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
}
