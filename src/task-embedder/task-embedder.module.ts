import { Module } from '@nestjs/common';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { TaskEmbedderService } from './task-embedder.service';

@Module({
  imports: [VectorStoreModule],
  providers: [TaskEmbedderService],
  exports: [TaskEmbedderService],
})
export class TaskEmbedderModule {}
