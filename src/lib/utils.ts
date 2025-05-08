import { format, parseISO, addDays, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

//Convert a Date object to IST (Asia/Kolkata)
export const toIST = (date: Date): Date => {
  return toZonedTime(date, IST_TIMEZONE);
};


//Format a Date object in IST, default: 'yyyy-MM-dd'
export const formatDate = (date: Date, dateFormat = 'yyyy-MM-dd'): string => {
  const istDate = toIST(date);
  return format(istDate, dateFormat);
};


//Parse a date string and convert to IST
export const parseDate = (dateStr: string): Date => {
  const parsed = parseISO(dateStr);
  return toIST(parsed);
};


//Generate a list of dates (in IST) between two given dates
export const getDateRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  let current = toIST(new Date(start));

  while (current <= end) {
    dates.push(current);
    current = toIST(addDays(current, 1));
  }

  return dates;
};


//Check if two dates are the same calendar day (in IST)
export const isSameCalendarDay = (date1: Date, date2: Date): boolean => {
  return isSameDay(toIST(date1), toIST(date2));
};

//Return the current date in IST
export const getCurrentDate = (): Date => {
  return toIST(new Date());
}

// Optional re-export of useful utilities
export { format, addDays, parseISO, isSameDay };