import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MeiliProvider } from './meili.provider';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { OutboxRelayService } from './outbox-relay.service';
import { SearchSyncWorker } from './search-sync.worker';

/**
 * SearchModule is global — SearchService can be injected anywhere
 * without importing the module in each feature module.
 */
@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'search-sync',
    }),
  ],
  controllers: [SearchController],
  providers: [MeiliProvider, SearchService, OutboxRelayService, SearchSyncWorker],
  exports: [SearchService],
})
export class SearchModule {}
