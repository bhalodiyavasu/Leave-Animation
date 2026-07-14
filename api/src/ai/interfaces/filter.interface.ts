// src/ai-copilot/interfaces/copilot-filters.interface.ts

export interface Filters {
  userNames?: string[];
  leaveIds?: string[];
  status?: string | null;
  department?: string | null;
  date?: string | null; // e.g. "TODAY", "YESTERDAY", or ISO string
  startDate?: string | null; // ISO string or relative keyword
  endDate?: string | null; // ISO string or relative keyword
  leaveType?: string | null;
}
