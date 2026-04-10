import { Module } from '@nestjs/common';

import { MarketController } from './market.controller';
import { MockMarketProvider } from './providers/mock-market.provider';
import { MARKET_PROVIDER } from './providers/market-provider.interface';
import { MarketService } from './market.service';

@Module({
  controllers: [MarketController],
  providers: [
    MarketService,
    { provide: MARKET_PROVIDER, useClass: MockMarketProvider },
  ],
})
export class MarketModule {}
