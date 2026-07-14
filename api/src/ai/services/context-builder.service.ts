// src/ai-copilot/services/context-builder.service.ts

import { Injectable } from '@nestjs/common';
import { Filters } from '../interfaces/filter.interface';

export interface ResolvedDateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class ContextBuilderService {
  /**
   * Resolves the filter's date/startDate/endDate keywords into actual Date objects
   * that Prisma can use in queries.
   */
  resolveDateFilters(filters: Filters): {
    startDate: Date | null;
    endDate: Date | null;
  } {
    // Single-date keyword takes priority
    if (filters.date) {
      const range = this.resolveKeyword(filters.date);
      if (range) return range;

      // Fallback: try to parse filters.date as a specific date (e.g. "27 JUNE")
      const d = new Date(filters.date);
      if (!isNaN(d.getTime())) {
        const currentYear = new Date().getFullYear();
        const hasYear = /\b\d{4}\b/.test(filters.date);
        if (!hasYear) {
          d.setFullYear(currentYear);
        }
        return {
          startDate: this.startOfDay(d),
          endDate: this.endOfDay(d),
        };
      }
    }

    // Explicit range
    if (filters.startDate || filters.endDate) {
      return {
        startDate: filters.startDate ? this.parseDate(filters.startDate) : null,
        endDate: filters.endDate ? this.parseDate(filters.endDate) : null,
      };
    }

    return { startDate: null, endDate: null };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private resolveKeyword(
    keyword: string,
  ): { startDate: Date; endDate: Date } | null {
    const now = new Date();
    const today = this.startOfDay(now);

    switch (keyword.toUpperCase()) {
      case 'TODAY': {
        return { startDate: today, endDate: this.endOfDay(now) };
      }
      case 'YESTERDAY': {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return { startDate: this.startOfDay(y), endDate: this.endOfDay(y) };
      }
      case 'TOMORROW': {
        const t = new Date(today);
        t.setDate(t.getDate() + 1);
        return { startDate: this.startOfDay(t), endDate: this.endOfDay(t) };
      }
      case 'THIS_WEEK': {
        const start = this.startOfWeek(now);
        return { startDate: start, endDate: this.endOfDay(now) };
      }
      case 'LAST_WEEK': {
        const start = this.startOfWeek(now);
        start.setDate(start.getDate() - 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return {
          startDate: this.startOfDay(start),
          endDate: this.endOfDay(end),
        };
      }
      case 'NEXT_WEEK': {
        const start = this.startOfWeek(now);
        start.setDate(start.getDate() + 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return {
          startDate: this.startOfDay(start),
          endDate: this.endOfDay(end),
        };
      }
      case 'THIS_MONTH': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: start, endDate: this.endOfDay(now) };
      }
      case 'LAST_MONTH': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: start, endDate: this.endOfDay(end) };
      }
      case 'NEXT_MONTH': {
        const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        return { startDate: start, endDate: this.endOfDay(end) };
      }
      default:
        return null;
    }
  }

  private parseDate(value: string): Date | null {
    const resolved = this.resolveKeyword(value);
    if (resolved) return resolved.startDate;

    const d = new Date(value);
    if (isNaN(d.getTime())) return null;

    const currentYear = new Date().getFullYear();
    const hasYear = /\b\d{4}\b/.test(value);
    if (!hasYear) {
      d.setFullYear(currentYear);
    }
    return d;
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    return this.startOfDay(d);
  }
}
