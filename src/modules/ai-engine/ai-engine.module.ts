import { Module } from '@nestjs/common';
import { AiEngineController } from './controllers/ai-engine.controller';
import { AiEngineService } from './services/ai-engine.service';

@Module({
  controllers: [AiEngineController],
  providers: [AiEngineService],
  exports: [AiEngineService]
})
export class AiEngineModule {}
