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


//Return the current date in IST
export const getCurrentDate = (): Date => {
  return toIST(new Date());
}

// Optional re-export of useful utilities
export { format, addDays, parseISO, isSameDay };