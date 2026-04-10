import { Injectable } from '@nestjs/common';

import {
  OptionChainResponse,
  OptionExpiryResponse,
  OptionsDataProvider,
} from './options-provider.interface';

@Injectable()
export class MockOptionsProvider implements OptionsDataProvider {
  getExpiries(symbol: string): Promise<OptionExpiryResponse> {
    return Promise.resolve({
      symbol: symbol.toUpperCase(),
      expiries: ['2026-04-18', '2026-04-25', '2026-05-30'],
    });
  }

  getChain(symbol: string, expiry: string): Promise<OptionChainResponse> {
    return Promise.resolve({
      symbol: symbol.toUpperCase(),
      expiry,
      spotPrice: 22784.4,
      rows: [
        {
          strike: 22500,
          ce: { oi: 173440, iv: 13.2, volume: 38920, ltp: 195.6 },
          pe: { oi: 211900, iv: 15.2, volume: 37650, ltp: 58.9 },
        },
        {
          strike: 22600,
          ce: { oi: 201800, iv: 12.7, volume: 46290, ltp: 138.2 },
          pe: { oi: 239400, iv: 16.1, volume: 42320, ltp: 79.4 },
        },
        {
          strike: 22700,
          ce: { oi: 238260, iv: 12.1, volume: 53180, ltp: 95.4 },
          pe: { oi: 278660, iv: 16.9, volume: 47510, ltp: 109.6 },
        },
      ],
    });
  }
}
