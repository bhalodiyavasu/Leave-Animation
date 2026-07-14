import { Module } from '@nestjs/common';
import { LeaveModule } from '../leave/leave.module';
import { UserModule } from '../user/user.module';
import { AiController } from './ai.controller';
import { AnalyticsService } from './services/analytics.service';
import { ContextBuilderService } from './services/context-builder.service';
import { IntentDetectionService } from './services/intent-detection.service';
import { IntentExecutorService } from './services/intent-executor.service';

@Module({
  imports: [LeaveModule, UserModule],
  controllers: [AiController],
  providers: [
    IntentDetectionService,
    IntentExecutorService,
    AnalyticsService,
    ContextBuilderService,
  ],
})
export class AiModule {}
