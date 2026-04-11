import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DhanOptionsProvider } from './providers/dhan-options.provider';
import { MockOptionsProvider } from './providers/mock-options.provider';
import { OPTIONS_PROVIDER } from './providers/options-provider.interface';
import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

@Module({
  controllers: [OptionsController],
  providers: [
    OptionsService,
    MockOptionsProvider,
    DhanOptionsProvider,
    {
      provide: OPTIONS_PROVIDER,
      inject: [ConfigService, MockOptionsProvider, DhanOptionsProvider],
      useFactory: (
        configService: ConfigService,
        mockProvider: MockOptionsProvider,
        dhanProvider: DhanOptionsProvider,
      ) => {
        const selectedProvider = configService
          .get<string>('OPTIONS_DATA_PROVIDER', 'mock')
          ?.toLowerCase();
        const hasDhanCredentials =
          Boolean(configService.get<string>('DHAN_CLIENT_ID')) &&
          Boolean(configService.get<string>('DHAN_ACCESS_TOKEN'));

        if (selectedProvider === 'dhan' && hasDhanCredentials) {
          return dhanProvider;
        }

        return mockProvider;
      },
    },
  ],
})
export class OptionsModule {}
