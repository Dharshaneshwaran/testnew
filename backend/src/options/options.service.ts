import { Inject, Injectable } from '@nestjs/common';

import { OPTIONS_PROVIDER } from './providers/options-provider.interface';
import type { OptionsDataProvider } from './providers/options-provider.interface';

@Injectable()
export class OptionsService {
  constructor(
    @Inject(OPTIONS_PROVIDER)
    private readonly provider: OptionsDataProvider,
  ) {}

  getExpiries(symbol: string) {
    return this.provider.getExpiries(symbol);
  }

  getChain(symbol: string, expiry: string) {
    return this.provider.getChain(symbol, expiry);
  }
}
