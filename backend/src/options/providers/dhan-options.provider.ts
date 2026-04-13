import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  OptionChainResponse,
  OptionChainRow,
  OptionExpiryResponse,
  OptionsDataProvider,
} from './options-provider.interface';

interface DhanOptionLeg {
  implied_volatility?: number;
  last_price?: number;
  oi?: number;
  volume?: number;
}

interface DhanOptionChainPayload {
  data?: {
    last_price?: number;
    oc?: Record<
      string,
      {
        ce?: DhanOptionLeg;
        pe?: DhanOptionLeg;
      }
    >;
  };
  status?: string;
}

interface DhanExpiryPayload {
  data?: string[];
  status?: string;
}

const UNDERLYING_MAP: Record<
  string,
  { securityId: number; exchangeSegment: string }
> = {
  NIFTY: { securityId: 13, exchangeSegment: 'IDX_I' },
  RELIANCE: { securityId: 1333, exchangeSegment: 'NSE_EQ' },
};

@Injectable()
export class DhanOptionsProvider implements OptionsDataProvider {
  constructor(private readonly configService: ConfigService) {}

  async getExpiries(symbol: string): Promise<OptionExpiryResponse> {
    const underlying = this.getUnderlying(symbol);
    const payload = await this.post<DhanExpiryPayload>(
      '/optionchain/expirylist',
      {
        UnderlyingScrip: underlying.securityId,
        UnderlyingSeg: underlying.exchangeSegment,
      },
    );

    return {
      symbol: symbol.toUpperCase(),
      expiries: payload.data ?? [],
    };
  }

  async getChain(symbol: string, expiry: string): Promise<OptionChainResponse> {
    const underlying = this.getUnderlying(symbol);
    const payload = await this.post<DhanOptionChainPayload>('/optionchain', {
      UnderlyingScrip: underlying.securityId,
      UnderlyingSeg: underlying.exchangeSegment,
      Expiry: expiry,
    });

    const rows = Object.entries(payload.data?.oc ?? {})
      .map<OptionChainRow>(([strike, value]) => ({
        strike: Number(strike),
        ce: {
          oi: value.ce?.oi ?? 0,
          iv: value.ce?.implied_volatility ?? 0,
          volume: value.ce?.volume ?? 0,
          ltp: value.ce?.last_price ?? 0,
        },
        pe: {
          oi: value.pe?.oi ?? 0,
          iv: value.pe?.implied_volatility ?? 0,
          volume: value.pe?.volume ?? 0,
          ltp: value.pe?.last_price ?? 0,
        },
      }))
      .sort((left, right) => left.strike - right.strike);

    return {
      symbol: symbol.toUpperCase(),
      expiry,
      spotPrice: payload.data?.last_price ?? 0,
      rows,
    };
  }

  private async post<T>(path: string, body: object): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = new URL(path.replace(/^\//, ''), `${baseUrl}/`);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'access-token': this.getAccessToken(),
          'client-id': this.getClientId(),
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Dhan provider request failed for ${path}`,
        {
          cause: error as Error,
        },
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Dhan provider returned ${response.status} for ${path}`,
      );
    }

    return (await response.json()) as T;
  }

  private getBaseUrl() {
    return (
      this.configService.get<string>('DHAN_API_BASE_URL')?.trim() ||
      'https://api.dhan.co/v2'
    );
  }

  private getClientId() {
    return this.configService.get<string>('DHAN_CLIENT_ID')?.trim() || '';
  }

  private getAccessToken() {
    return this.configService.get<string>('DHAN_ACCESS_TOKEN')?.trim() || '';
  }

  private getUnderlying(symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();
    const underlying = UNDERLYING_MAP[normalizedSymbol];
    if (!underlying) {
      throw new InternalServerErrorException(
        `Dhan provider is not configured for ${normalizedSymbol}`,
      );
    }

    return underlying;
  }
}
