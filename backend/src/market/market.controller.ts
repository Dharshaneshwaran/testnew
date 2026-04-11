import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

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

  @Get('futures/:kind')
  getFutures(@Param('kind') kind: string) {
    if (kind !== 'stock' && kind !== 'index') {
      throw new BadRequestException('Futures kind must be stock or index');
    }

    return this.marketService.getFutures(kind);
  }

  @Get('timeseries/:kind/:symbol')
  getTimeSeries(
    @Param('kind') kind: string,
    @Param('symbol') symbol: string,
    @Query('range') range?: string,
    @Query('interval') interval?: string,
  ) {
    if (kind !== 'stock' && kind !== 'index' && kind !== 'equity') {
      throw new BadRequestException(
        'Timeseries kind must be equity, stock, or index',
      );
    }

    return this.marketService.getTimeSeries(
      kind === 'stock' ? 'equity' : kind,
      symbol,
      range,
      interval,
    );
  }

  @Get('movers')
  getMovers() {
    return this.marketService.getMovers();
  }

  @Get('sectors')
  getSectors() {
    return this.marketService.getSectorPerformance();
  }

  @Get('search')
  search(@Query('q') query?: string) {
    return this.marketService.search(query ?? '');
  }

  @Get('research/:symbol')
  getResearch(@Param('symbol') symbol: string) {
    return this.marketService.getResearch(symbol);
  }
}
