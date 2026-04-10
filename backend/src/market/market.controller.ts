import { Controller, Get, Param } from '@nestjs/common';

import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('equity/:symbol')
  getEquity(@Param('symbol') symbol: string) {
    return this.marketService.getEquity(symbol);
  }

  @Get('index/:symbol')
  getIndex(@Param('symbol') symbol: string) {
    return this.marketService.getIndex(symbol);
  }
}
