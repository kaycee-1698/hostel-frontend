import { useEffect, useState } from 'react';
import { getBookingsByBedAndDateRange } from '@/lib/api';
import { CalendarBookings } from '@/types';
import {formatDate } from '@/lib/dateUtils';

export function useCalendarBookings(startDate: Date, endDate: Date): {
  calendarBookings: CalendarBookings;
  loading: boolean;
  error: string | null;
  fetchCalendarBookings: () => Promise<void>;
} {
  const [calendarBookings, setCalendarBookings] = useState<CalendarBookings>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBookingsByBedAndDateRange(
        formatDate(startDate),
        formatDate(endDate)
      );
      setCalendarBookings(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load calendar bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate > endDate) return;
    fetchCalendarBookings();
  }, [startDate, endDate]);

  return { 
    calendarBookings, 
    loading, 
    error,
    fetchCalendarBookings
  };
}
