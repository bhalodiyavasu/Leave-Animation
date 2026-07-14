import { Body, Controller, Post } from '@nestjs/common';
import { CopilotRequestDto } from './dto/request-ai..dto';
import { IntentDetectionService } from './services/intent-detection.service';
import { IntentExecutorService } from './services/intent-executor.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly intentDetectionService: IntentDetectionService,
    private readonly intentExecutorService: IntentExecutorService,
  ) {}

  @Post()
  async create(@Body() dto: CopilotRequestDto) {
    const detected = await this.intentDetectionService.detectIntent(
      dto.message,
      dto.history,
    );

    // If the intent is UNKNOWN or requires more info, return the detection result directly
    if (detected.intent === 'UNKNOWN' || detected.requiresMoreInfo) {
      return {
        message:
          detected.question ||
          "I'm not sure what you mean. Could you rephrase your request?",
        intent: detected,
        data: null,
      };
    }

    // Otherwise, execute the intent!
    const result = await this.intentExecutorService.execute(detected);
    return {
      message: result.message,
      intent: detected,
      data: result.data,
      notifyLeaveUpdate: result.notifyLeaveUpdate,
      notifyAnalyticsRefresh: result.notifyAnalyticsRefresh,
    };
  }
}
