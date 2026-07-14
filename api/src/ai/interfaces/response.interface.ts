// src/ai-copilot/interfaces/ai-intent-response.interface.ts

import { CopilotAction } from '../enums/action.enum';
import { CopilotIntent } from '../enums/intent.enum';
import { Filters } from './filter.interface';

export interface AiIntentResponse {
  intent: CopilotIntent;
  action: CopilotAction;
  confidence: number;
  requiresMoreInfo: boolean;
  question: string | null;
  filters: Filters;
}
