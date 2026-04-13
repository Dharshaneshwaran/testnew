import {
  BadRequestException,
  Controller,
  Get,
  MessageEvent,
  Param,
  Query,
  Sse,
} from '@nestjs/common';
import {
  Observable,
  catchError,
  from,
  interval,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

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

  @Get('futures/:kind/:symbol')
  getFuture(@Param('kind') kind: string, @Param('symbol') symbol: string) {
    if (kind !== 'stock' && kind !== 'index') {
      throw new BadRequestException('Futures kind must be stock or index');
    }

    return this.marketService.getFuture(kind, symbol);
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

  @Get('timeseries/futures/:kind/:symbol')
  getFutureTimeSeries(
    @Param('kind') kind: string,
    @Param('symbol') symbol: string,
    @Query('range') range?: string,
    @Query('interval') interval?: string,
  ) {
    if (kind !== 'stock' && kind !== 'index') {
      throw new BadRequestException('Futures kind must be stock or index');
    }

    return this.marketService.getFutureTimeSeries(
      kind,
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

  @Sse('stream/:kind/:symbol')
  stream(
    @Param('kind') kind: string,
    @Param('symbol') symbol: string,
    @Query('intervalMs') intervalMs?: string,
  ): Observable<MessageEvent> {
    const normalizedKind = kind.toLowerCase();
    if (normalizedKind !== 'equity' && normalizedKind !== 'index') {
      throw new BadRequestException('Stream kind must be equity or index');
    }

    const requested = Number(intervalMs ?? 5000);
    const resolved = Number.isFinite(requested) ? requested : 5000;
    const pollMs = Math.max(2000, Math.min(60_000, Math.round(resolved)));

    return interval(pollMs).pipe(
      startWith(0),
      switchMap(() =>
        from(
          normalizedKind === 'index'
            ? this.marketService.getIndex(symbol)
            : this.marketService.getEquity(symbol),
        ).pipe(
          map((quote) => ({
            data: {
              type: 'quote',
              kind: normalizedKind,
              ...quote,
            },
          })),
          catchError((error: unknown) =>
            of({
              data: {
                type: 'error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Market stream error',
                timestamp: new Date().toISOString(),
              },
            }),
          ),
        ),
      ),
    );
  }

  @Sse('stream/futures/:kind/:symbol')
  streamFutures(
    @Param('kind') kind: string,
    @Param('symbol') symbol: string,
    @Query('intervalMs') intervalMs?: string,
  ): Observable<MessageEvent> {
    if (kind !== 'stock' && kind !== 'index') {
      throw new BadRequestException('Futures kind must be stock or index');
    }

    const requested = Number(intervalMs ?? 2000);
    const resolved = Number.isFinite(requested) ? requested : 2000;
    const pollMs = Math.max(1000, Math.min(20_000, Math.round(resolved)));

    return interval(pollMs).pipe(
      startWith(0),
      switchMap(() =>
        from(this.marketService.getFuture(kind, symbol)).pipe(
          map((future) => ({
            data: {
              type: 'future',
              kind,
              ...future,
            },
          })),
          catchError((error: unknown) =>
            of({
              data: {
                type: 'error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Market stream error',
                timestamp: new Date().toISOString(),
              },
            }),
          ),
        ),
      ),
    );
  }
}
