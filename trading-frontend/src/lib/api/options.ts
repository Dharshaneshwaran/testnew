import { apiRequest } from '@/lib/api/client';
import { ExpiryItem, OptionChainRow } from '@/types/option';

interface ExpiryResponse {
  symbol: string;
  expiries: string[];
}

interface ChainResponse {
  symbol: string;
  expiry: string;
  spotPrice: number;
  rows: Array<{
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
  }>;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getExpiries(symbol: string): Promise<ExpiryItem[]> {
  const response = await apiRequest<ExpiryResponse>(
    `/options/expiry/${encodeURIComponent(symbol)}`,
  );

  return response.expiries.map((expiry) => ({
    value: expiry,
    label: new Date(expiry).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }));
}

export async function getOptionChain(
  symbol: string,
  expiry: string,
): Promise<OptionChainRow[]> {
  const response = await apiRequest<ChainResponse>(
    `/options/chain/${encodeURIComponent(symbol)}/${encodeURIComponent(expiry)}`,
  );

  return response.rows.map((row) => ({
    strike: toNumber(row.strike),
    ce: {
      oi: toNumber(row.ce.oi),
      iv: toNumber(row.ce.iv),
      volume: toNumber(row.ce.volume),
      ltp: toNumber(row.ce.ltp),
      change: 0,
    },
    pe: {
      oi: toNumber(row.pe.oi),
      iv: toNumber(row.pe.iv),
      volume: toNumber(row.pe.volume),
      ltp: toNumber(row.pe.ltp),
      change: 0,
    },
  }));
}
