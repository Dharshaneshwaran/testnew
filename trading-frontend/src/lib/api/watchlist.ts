import { getEquityQuote } from '@/lib/api/market';
import { apiRequest } from '@/lib/api/client';
import { WatchlistFolderType, WatchlistItemType } from '@/types/watchlist';

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

  const quoteMap = new Map<string, { ltp: number; change: number; changePercent: number }>();
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await getEquityQuote(symbol);
        quoteMap.set(symbol, {
          ltp: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
        });
      } catch {
        quoteMap.set(symbol, {
          ltp: 0,
          change: 0,
          changePercent: 0,
        });
      }
    }),
  );

  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    items: folder.items.map((item): WatchlistItemType => {
      const quote = quoteMap.get(item.symbol) ?? {
        ltp: 0,
        change: 0,
        changePercent: 0,
      };

      return {
        symbol: item.symbol,
        exchange: normalizeExchange(item.exchange),
        ltp: quote.ltp,
        change: quote.change,
        changePercent: quote.changePercent,
      };
    }),
  }));
}
