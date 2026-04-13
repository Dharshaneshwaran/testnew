import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from './../src/app.module';

describe('Market futures stream (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.MARKET_DATA_PROVIDER = 'mock';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  it('/market/stream/futures/stock/:symbol (GET) returns SSE data', async () => {
    const url = `${await app.getUrl()}/market/stream/futures/stock/TCS?intervalMs=1000`;
    const controller = new AbortController();

    const response = await fetch(url, {
      headers: { Accept: 'text/event-stream' },
      signal: controller.signal,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const decoder = new TextDecoder();
    const { value } = await reader!.read();
    const chunk = decoder.decode(value);

    expect(chunk).toContain('data:');
    expect(chunk).toContain('"type":"future"');

    await reader!.cancel();
    controller.abort();
  });

  afterEach(async () => {
    await app.close();
  });
});
