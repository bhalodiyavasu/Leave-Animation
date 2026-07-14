// src/ai-copilot/services/intent-detection.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OPEN_ROUTER_API_KEY } from 'src/shared/constants/constant';
import { AI_SYSTEM_PROMPT } from '../constants/ai-prompt.constant';
import { CopilotAction } from '../enums/action.enum';
import { CopilotIntent } from '../enums/intent.enum';
import { AiIntentResponse } from '../interfaces/response.interface';

@Injectable()
export class IntentDetectionService {
  private readonly logger = new Logger(IntentDetectionService.name);

  constructor(private readonly configService: ConfigService) {}

  async detectIntent(userMessage: string, history?: any[]): Promise<AiIntentResponse> {
    try {
      const rawResponse = await this.callAiApi(userMessage, history);
      const parsed = this.parseAiResponse(rawResponse);
      return this.validateAndNormalizeResponse(parsed);
    } catch (error) {
      this.logger.error(
        `Intent detection failed: ${error.message}`,
        error.stack,
      );
      return this.buildFallbackResponse();
    }
  }

  // ─── Private: AI API Call ────────────────────────────────────────────────────

  private async callAiApi(userMessage: string, history?: any[]): Promise<string> {
    let apiKey = this.configService.get<string>('OPEN_ROUTER_API_KEY') || OPEN_ROUTER_API_KEY;

    // Clean up single or double quotes around the key if present
    if (apiKey) {
      apiKey = apiKey.replace(/^['"]|['"]$/g, '');
    }

    this.logger.log(`Calling AI API with message: "${userMessage}"`);
    this.logger.log(`API Key defined: ${!!apiKey}`);

    const baseUrl = this.configService.get<string>(
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    );
    const model = this.configService.get<string>(
      'OPENROUTER_MODEL',
      'openai/gpt-4o-mini',
    );

    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: `${AI_SYSTEM_PROMPT}\n\nCURRENT REFERENCE DATE: ${new Date().toDateString()}`,
      },
    ];

    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.1, // low temperature for deterministic structured output
        messages,
      }),
    });

    this.logger.log(`AI API status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`AI API error body: ${errorBody}`);
      throw new Error(`AI API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content ?? '';
    this.logger.log(`AI Raw response: ${content}`);
    return content;
  }

  // ─── Private: Parse AI JSON Response ─────────────────────────────────────────

  private parseAiResponse(rawResponse: string): Partial<AiIntentResponse> {
    const cleaned = rawResponse
      .trim()
      .replace(/^```json|```$/g, '')
      .trim();

    try {
      return JSON.parse(cleaned) as Partial<AiIntentResponse>;
    } catch {
      this.logger.warn(
        `Failed to parse AI response as JSON. Raw: ${rawResponse}`,
      );
      throw new Error('AI returned non-JSON response');
    }
  }

  // ─── Private: Validate & Normalize ───────────────────────────────────────────

  private validateAndNormalizeResponse(
    parsed: Partial<AiIntentResponse>,
  ): AiIntentResponse {
    const intent = this.resolveIntent(parsed.intent as string);
    const action = this.resolveAction(parsed.action as string);

    return {
      intent,
      action,
      confidence: this.clampConfidence(parsed.confidence),
      requiresMoreInfo: parsed.requiresMoreInfo === true,
      question: parsed.requiresMoreInfo ? (parsed.question ?? null) : null,
      filters: {
        userNames: parsed.filters?.userNames ?? [],
        leaveIds: parsed.filters?.leaveIds ?? [],
        status: parsed.filters?.status ?? null,
        department: parsed.filters?.department ?? null,
        date: parsed.filters?.date ?? null,
        startDate: parsed.filters?.startDate ?? null,
        endDate: parsed.filters?.endDate ?? null,
        leaveType: parsed.filters?.leaveType ?? null,
      },
    };
  }

  private resolveIntent(value: string): CopilotIntent {
    const valid = Object.values(CopilotIntent) as string[];
    return valid.includes(value)
      ? (value as CopilotIntent)
      : CopilotIntent.UNKNOWN;
  }

  private resolveAction(value: string): CopilotAction {
    const valid = Object.values(CopilotAction) as string[];
    return valid.includes(value)
      ? (value as CopilotAction)
      : CopilotAction.NONE;
  }

  private clampConfidence(value: unknown): number {
    const num = typeof value === 'number' ? value : 0;
    return Math.min(1, Math.max(0, num));
  }

  private buildFallbackResponse(): AiIntentResponse {
    return {
      intent: CopilotIntent.UNKNOWN,
      action: CopilotAction.NONE,
      confidence: 0,
      requiresMoreInfo: false,
      question: null,
      filters: {
        userNames: [],
        leaveIds: [],
        status: null,
        department: null,
        date: null,
        startDate: null,
        endDate: null,
        leaveType: null,
      },
    };
  }
}
