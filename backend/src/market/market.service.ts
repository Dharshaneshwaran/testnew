import { Inject, Injectable } from '@nestjs/common';

import { MARKET_PROVIDER } from './providers/market-provider.interface';
import type { MarketDataProvider } from './providers/market-provider.interface';

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
}
