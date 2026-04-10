import { Controller, Get, Param } from '@nestjs/common';

import { OptionsService } from './options.service';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get('expiry/:symbol')
  getExpiry(@Param('symbol') symbol: string) {
    return this.optionsService.getExpiries(symbol);
  }

  @Get('chain/:symbol/:expiry')
  getChain(@Param('symbol') symbol: string, @Param('expiry') expiry: string) {
    return this.optionsService.getChain(symbol, expiry);
  }
}
