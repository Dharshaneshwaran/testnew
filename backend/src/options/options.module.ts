import { Module } from '@nestjs/common';

import { MockOptionsProvider } from './providers/mock-options.provider';
import { OPTIONS_PROVIDER } from './providers/options-provider.interface';
import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

@Module({
  controllers: [OptionsController],
  providers: [
    OptionsService,
    { provide: OPTIONS_PROVIDER, useClass: MockOptionsProvider },
  ],
})
export class OptionsModule {}
