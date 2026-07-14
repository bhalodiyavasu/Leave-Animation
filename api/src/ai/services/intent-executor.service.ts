// src/ai-copilot/services/intent-executor.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { LeaveService } from 'src/leave/leave.service';
import { UserService } from 'src/user/user.service';
import { CopilotAction } from '../enums/action.enum';
import { CopilotIntent } from '../enums/intent.enum';
import { AiIntentResponse } from '../interfaces/response.interface';
import { AnalyticsService } from './analytics.service';

export interface ExecutionResult {
  message: string;
  data: unknown;
  notifyLeaveUpdate?: {
    action: string;
    leaveIds: string[];
    updatedCount: number;
  };
  notifyAnalyticsRefresh?: boolean;
}

@Injectable()
export class IntentExecutorService {
  private readonly logger = new Logger(IntentExecutorService.name);

  constructor(
    private readonly leaveService: LeaveService,
    private readonly userService: UserService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async execute(intentResponse: AiIntentResponse): Promise<ExecutionResult> {
    const { intent, action, filters } = intentResponse;
    console.log(`Executing intent=${intent} action=${action}`);

    switch (intent) {
      case CopilotIntent.GET_LEAVES:
        console.log('1');
        return this.executeGetLeaves(action, filters);

      case CopilotIntent.UPDATE_LEAVES:
        console.log('2');
        return this.executeUpdateLeaves(action, filters);

      case CopilotIntent.GET_USERS:
        console.log('3');
        return this.executeGetUsers(action, filters);

      case CopilotIntent.GET_ANALYTICS:
        console.log('4');
        return this.executeGetAnalytics(filters);

      case CopilotIntent.GREETING:
        return {
          message: 'Hello! I am your Coral Copilot. How can I help you today with your leave management?',
          data: null,
        };

      default:
        return {
          message:
            "I'm not sure what you mean. Could you rephrase your request?",
          data: null,
        };
    }
  }

  // ─── GET_LEAVES ───────────────────────────────────────────────────────────────

  private async executeGetLeaves(
    action: CopilotAction,
    filters: AiIntentResponse['filters'],
  ): Promise<ExecutionResult> {
    // Special sub-intent: employees currently on leave
    console.log('filter>>>>>>', filters);
    console.log('event-1');
    if (filters.status === 'ACTIVE' || filters.date === 'TODAY') {
      console.log('event-2');
      const result = await this.leaveService.queryLeaves(filters);
      return {
        message: `Found ${result.total} leave record(s).`,
        data: result,
      };
    }

    const result = await this.leaveService.queryLeaves(filters);
    return {
      message: `Found ${result.total} leave record(s).`,
      data: result,
    };
  }

  // ─── UPDATE_LEAVES ────────────────────────────────────────────────────────────

  private async executeUpdateLeaves(
    action: CopilotAction,
    filters: AiIntentResponse['filters'],
  ): Promise<ExecutionResult> {
    let result: { updatedCount: number; leaveIds: string[]; message?: string };

    switch (action) {
      case CopilotAction.APPROVE:
        result = await this.leaveService.approveLeaves(filters);
        break;

      case CopilotAction.REJECT:
        result = await this.leaveService.rejectLeaves(filters);
        break;

      case CopilotAction.CANCEL:
        result = await this.leaveService.cancelLeaves(filters);
        break;

      default:
        return { message: 'Unknown update action.', data: null };
    }

    if (result.updatedCount === 0) {
      return {
        message: result.message ?? 'No leaves matched your criteria.',
        data: result,
      };
    }

    const actionLabel = action.charAt(0) + action.slice(1).toLowerCase() + 'd';

    return {
      message: `Successfully ${actionLabel} ${result.updatedCount} leave(s).`,
      data: result,
      notifyLeaveUpdate: {
        action: action,
        leaveIds: result.leaveIds,
        updatedCount: result.updatedCount,
      },
      notifyAnalyticsRefresh: true,
    };
  }

  // ─── GET_USERS ───────────────────────────────────────────────────────────────

  private async executeGetUsers(
    action: CopilotAction,
    filters: AiIntentResponse['filters'],
  ): Promise<ExecutionResult> {
    // Detect "on leave today" queries from filters
    const wantsOnLeave =
      filters.status === 'APPROVED' && filters.date === 'TODAY';
    const wantsCreatedLeaveToday = filters.date === 'TODAY' && !filters.status;

    if (wantsOnLeave) {
      const result = await this.userService.queryUsersOnLeaveToday();
      return {
        message: `${result.total} user(s) are currently on leave today.`,
        data: result,
      };
    }

    if (wantsCreatedLeaveToday) {
      const result =
        await this.userService.queryUsersWhoCreatedLeaveToday();
      return {
        message: `${result.total} user(s) created a leave request today.`,
        data: result,
      };
    }

    const result = await this.userService.queryUsers(filters);
    return {
      message: `Found ${result.total} user(s).`,
      data: result,
    };
  }

  // ─── GET_ANALYTICS ────────────────────────────────────────────────────────────

  private async executeGetAnalytics(
    filters: AiIntentResponse['filters'],
  ): Promise<ExecutionResult> {
    const result = await this.analyticsService.getLeaveAnalytics(filters);
    return {
      message: 'Here is the leave analytics summary.',
      data: result,
    };
  }
}
