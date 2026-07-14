import { Module } from '@nestjs/common';
import { ContextBuilderService } from 'src/ai/services/context-builder.service';
import { LeaveController } from './leave.controller';
import { LeaveGateway } from './leave.gateway';
import { LeaveService } from './leave.service';

@Module({
  controllers: [LeaveController],
  providers: [LeaveService, LeaveGateway, ContextBuilderService],
  exports: [LeaveGateway, LeaveService],
})
export class LeaveModule {}
