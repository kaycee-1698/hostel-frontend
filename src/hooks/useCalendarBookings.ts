import { useCallback, useEffect, useRef, useState } from 'react';
import { getBookingsByBedAndDateRange } from '@/lib/api';
import { CalendarData } from '@/types';
import { format } from 'date-fns';

export function useCalendarBookings(startDate: Date, endDate: Date) {
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');
  const key = `${start}/${end}`;
  const latestRequest = useRef(0);
  const [state, setState] = useState<{
    key: string; data: CalendarData; loading: boolean; error: string | null;
  }>({ key: '', data: { calendarBookings: {} }, loading: true, error: null });

  const fetchCalendarBookings = useCallback(async () => {
    const request = ++latestRequest.current;
    setState({ key, data: { calendarBookings: {} }, loading: true, error: null });
    try {
      const data = await getBookingsByBedAndDateRange(start, end);
      if (request === latestRequest.current) {
        setState({ key, data, loading: false, error: null });
      }
    } catch {
      if (request === latestRequest.current) {
        setState({ key, data: { calendarBookings: {} }, loading: false, error: 'Failed to load calendar bookings. Please try again.' });
      }
    }
  }, [start, end, key]);

  useEffect(() => {
    void fetchCalendarBookings();
    return () => { ++latestRequest.current; };
  }, [fetchCalendarBookings]);

  // Hide the previous range immediately, before the new effect starts.
  const current = state.key === key;
  return {
    calendarBookings: current ? state.data.calendarBookings : {},
    loading: !current || state.loading,
    error: current ? state.error : null,
    fetchCalendarBookings,
  };
}
