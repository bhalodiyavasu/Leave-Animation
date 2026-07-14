import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";

export const DATE_RANGE_OPTIONS = {
  ALL_TIME: "all_time",
  TODAY: "today",
  THIS_WEEK: "this_week",
  THIS_MONTH: "this_month",
  THIS_QUARTER: "this_quarter",
  THIS_YEAR: "this_year",
};

export const getDateRangeOptions = () => [
  { name: "All Time", value: DATE_RANGE_OPTIONS.ALL_TIME },
  { name: "Today", value: DATE_RANGE_OPTIONS.TODAY },
  { name: "This Week", value: DATE_RANGE_OPTIONS.THIS_WEEK },
  { name: "This Month", value: DATE_RANGE_OPTIONS.THIS_MONTH },
  { name: "This Quarter", value: DATE_RANGE_OPTIONS.THIS_QUARTER },
  { name: "This Year", value: DATE_RANGE_OPTIONS.THIS_YEAR },
];

export const getDateRangeFromValue = (
  value: string,
): { startDate: string; endDate: string } => {
  const now = new Date();
  const dateFormate = "yyyy-MM-dd";

  switch (value) {
    case DATE_RANGE_OPTIONS.TODAY:
      return {
        startDate: format(startOfDay(now), dateFormate),
        endDate: format(endOfDay(now), dateFormate),
      };

    case DATE_RANGE_OPTIONS.THIS_WEEK:
      return {
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), dateFormate),
        endDate: format(endOfWeek(now, { weekStartsOn: 1 }), dateFormate),
      };

    case DATE_RANGE_OPTIONS.THIS_MONTH:
      return {
        startDate: format(startOfMonth(now), dateFormate),
        endDate: format(endOfMonth(now), dateFormate),
      };

    case DATE_RANGE_OPTIONS.THIS_QUARTER:
      return {
        startDate: format(startOfQuarter(now), dateFormate),
        endDate: format(endOfQuarter(now), dateFormate),
      };

    case DATE_RANGE_OPTIONS.THIS_YEAR:
      return {
        startDate: format(startOfYear(now), dateFormate),
        endDate: format(endOfYear(now), dateFormate),
      };

    default:
      return { startDate: "", endDate: "" };
  }
};
