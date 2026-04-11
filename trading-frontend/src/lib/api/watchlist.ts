import { getEquityQuote, getTimeSeries } from '@/lib/api/market';
import { apiRequest } from '@/lib/api/client';
import { WatchlistFolderType, WatchlistItemType } from '@/types/watchlist';
import { PricePoint } from '@/types/market';

interface ApiWatchlistItem {
  id: string;
  symbol: string;
  exchange?: string | null;
}

interface ApiWatchlistFolder {
  id: string;
  name: string;
  items: ApiWatchlistItem[];
}

function normalizeExchange(exchange?: string | null): 'NSE' | 'BSE' {
  return exchange?.toUpperCase() === 'BSE' ? 'BSE' : 'NSE';
}

export async function getWatchlistFolders(token: string): Promise<WatchlistFolderType[]> {
  const folders = await apiRequest<ApiWatchlistFolder[]>(
    '/watchlist/folders',
    { method: 'GET' },
    token,
  );

  const symbols = Array.from(
    new Set(folders.flatMap((folder) => folder.items.map((item) => item.symbol))),
  );

  const quoteMap = new Map<string, { ltp: number; change: number; changePercent: number; sparkline: PricePoint[] }>();
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const [quote, sparkline] = await Promise.all([
          getEquityQuote(symbol),
          getTimeSeries('equity', symbol, { range: '1d', interval: '30m' }),
        ]);
        quoteMap.set(symbol, {
          ltp: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          sparkline,
        });
      } catch {
        quoteMap.set(symbol, {
          ltp: 0,
          change: 0,
          changePercent: 0,
          sparkline: [],
        });
      }
    }),
  );

  return folders.map((folder): WatchlistFolderType => {
    // Deduplicate items by symbol
    const seen = new Set();
    const uniqueItems = folder.items.filter(item => {
      const symbol = item.symbol.toUpperCase();
      if (seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    });

    return {
      id: folder.id,
      name: folder.name,
      items: uniqueItems.map((item): WatchlistItemType => {
        const quote = quoteMap.get(item.symbol) ?? {
          ltp: 0,
          change: 0,
          changePercent: 0,
          sparkline: [],
        };

        return {
          id: item.id,
          symbol: item.symbol,
          exchange: normalizeExchange(item.exchange),
          ltp: quote.ltp,
          change: quote.change,
          changePercent: quote.changePercent,
          sparkline: quote.sparkline,
        };
      }),
    };
  });
}
export async function createWatchlistFolder(
  token: string,
  name: string,
): Promise<WatchlistFolderType> {
  const folder = await apiRequest<ApiWatchlistFolder>(
    '/watchlist/folders',
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    },
    token,
  );

  return {
    id: folder.id,
    name: folder.name,
    items: [],
  };
}

export async function addWatchlistItem(
  token: string,
  folderId: string,
  symbol: string,
  exchange?: string,
): Promise<WatchlistItemType> {
  const item = await apiRequest<ApiWatchlistItem>(
    '/watchlist/items',
    {
      method: 'POST',
      body: JSON.stringify({ folderId, symbol, exchange }),
    },
    token,
  );

  let quote;
  try {
    quote = await getEquityQuote(symbol);
  } catch (err) {
    console.warn(`Failed to fetch quote for ${symbol} after adding:`, err);
    return {
      id: item.id,
      symbol: item.symbol,
      exchange: normalizeExchange(item.exchange),
      ltp: 0,
      change: 0,
      changePercent: 0,
    };
  }

  return {
    id: item.id,
    symbol: item.symbol,
    exchange: normalizeExchange(item.exchange),
    ltp: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
  };
}

export async function deleteWatchlistItem(
  token: string,
  itemId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/watchlist/items/${itemId}`,
    { method: 'DELETE' },
    token,
  );
}

export async function removeWatchlistItem(
  token: string,
  folderId: string,
  symbol: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    '/watchlist/items/remove',
    {
      method: 'POST',
      body: JSON.stringify({ folderId, symbol }),
    },
    token,
  );
}

export async function deleteWatchlistFolder(
  token: string,
  folderId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/watchlist/folders/${folderId}`,
    { method: 'DELETE' },
    token,
  );
}
