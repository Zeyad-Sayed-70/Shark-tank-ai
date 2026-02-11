import { Module } from '@nestjs/common';
import { SharksController } from './sharks.controller';
import { SharksService } from './sharks.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [VectorStoreModule],
  controllers: [SharksController],
  providers: [SharksService],
  exports: [SharksService],
})
export class SharksModule {}
