import { format, parseISO, isValid } from "date-fns";

export const formatDate = (
  date: string | Date | null | undefined,
  outputFormat: string = "yyyy-MM-dd",
): string => {
  if (!date) return "";

  try {
    let parsedDate: Date;

    if (typeof date === "string") {
      parsedDate = parseISO(date);
    } else {
      parsedDate = date;
    }

    if (!isValid(parsedDate)) return "";

    return format(parsedDate, outputFormat);
  } catch {
    return "";
  }
};
export const formatDateForInput = formatDate;
