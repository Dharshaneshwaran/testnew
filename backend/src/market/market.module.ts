import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MarketController } from './market.controller';
import { MockMarketProvider } from './providers/mock-market.provider';
import { MARKET_PROVIDER } from './providers/market-provider.interface';
import { YahooMarketProvider } from './providers/yahoo-market.provider';
import { MarketService } from './market.service';

@Module({
  controllers: [MarketController],
  providers: [
    MarketService,
    MockMarketProvider,
    YahooMarketProvider,
    {
      provide: MARKET_PROVIDER,
      inject: [ConfigService, MockMarketProvider, YahooMarketProvider],
      useFactory: (
        configService: ConfigService,
        mockProvider: MockMarketProvider,
        yahooProvider: YahooMarketProvider,
      ) => {
        const selectedProvider = configService
          .get<string>('MARKET_DATA_PROVIDER', 'yahoo')
          ?.toLowerCase();

        return selectedProvider === 'mock' ? mockProvider : yahooProvider;
      },
    },
  ],
})
export class MarketModule {}
