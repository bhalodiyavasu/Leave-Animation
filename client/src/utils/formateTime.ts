import { format, parseISO, isValid } from "date-fns";

export const formatTime = (
  date: string | Date | null | undefined,
  is24Hour: boolean = false,
): string => {
  if (!date) return "N/A";

  try {
    const parsedDate = typeof date === "string" ? parseISO(date.replace("Z", "")) : date;
    if (!isValid(parsedDate)) return "N/A";

    return format(parsedDate, is24Hour ? "HH:mm" : "hh:mm a");
  } catch {
    return "N/A";
  }
};


// Usage
// {formatTime(row.startTime)} = 10:30 PM
// {formatTime(row.startTime, "24h")} = 22:30