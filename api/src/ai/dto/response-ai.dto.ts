// src/ai-copilot/dtos/copilot-response.dto.ts

import { CopilotAction } from '../enums/action.enum';
import { CopilotIntent } from '../enums/intent.enum';
import { AiIntentResponse } from '../interfaces/response.interface';

export class CopilotResponseDto {
  success: boolean;
  message: string;
  intent: CopilotIntent;
  action: CopilotAction;
  requiresMoreInfo: boolean;
  question: string | null;
  data: unknown;
  confidence: number;
  timestamp: string;

  static fromIntentResult(
    intentResponse: AiIntentResponse,
    data: unknown,
    message: string,
  ): CopilotResponseDto {
    const dto = new CopilotResponseDto();
    dto.success = true;
    dto.message = message;
    dto.intent = intentResponse.intent;
    dto.action = intentResponse.action;
    dto.requiresMoreInfo = intentResponse.requiresMoreInfo;
    dto.question = intentResponse.question;
    dto.data = data;
    dto.confidence = intentResponse.confidence;
    dto.timestamp = new Date().toISOString();
    return dto;
  }
}
