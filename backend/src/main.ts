import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOriginEnv = process.env.CORS_ORIGIN?.trim();
  const corsOriginsEnv = process.env.CORS_ORIGINS?.trim();
  const corsOriginSetting = corsOriginsEnv || corsOriginEnv;

  const defaultDevOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  const allowedOrigins = corsOriginSetting
    ? corsOriginSetting
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .map((origin) => (origin === '*' ? origin : origin.replace(/\/+$/, '')))
    : process.env.NODE_ENV === 'production'
      ? ['*']
      : defaultDevOrigins;

  const allowAllOrigins =
    allowedOrigins.length === 1 && allowedOrigins[0] === '*';

  app.enableCors({
    origin: allowAllOrigins ? true : allowedOrigins,
    credentials: !allowAllOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
