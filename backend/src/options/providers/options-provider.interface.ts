export interface OptionExpiryResponse {
  symbol: string;
  expiries: string[];
}

export interface OptionChainRow {
  strike: number;
  ce: {
    oi: number;
    iv: number;
    volume: number;
    ltp: number;
  };
  pe: {
    oi: number;
    iv: number;
    volume: number;
    ltp: number;
  };
}

export interface OptionChainResponse {
  symbol: string;
  expiry: string;
  spotPrice: number;
  rows: OptionChainRow[];
}

export interface OptionsDataProvider {
  getExpiries(symbol: string): Promise<OptionExpiryResponse>;
  getChain(symbol: string, expiry: string): Promise<OptionChainResponse>;
}

export const OPTIONS_PROVIDER = 'OPTIONS_PROVIDER';
