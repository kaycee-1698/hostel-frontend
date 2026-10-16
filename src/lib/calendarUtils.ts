import { addDays, differenceInCalendarDays, format, isWeekend, parseISO } from 'date-fns';
import { CalendarAssignment, CalendarBookings, Room } from '@/types';
export type CalendarDrag = { assignment: CalendarAssignment; bedId: number; grabbedDay?: string };
export function defaultCalendarRange(today: string) {
  return { start: addDays(parseISO(today), -1), end: addDays(parseISO(today), 12) };
}
export function movedStay(assignment: CalendarAssignment, start: string) {
  const nights = differenceInCalendarDays(parseISO(assignment.check_out), parseISO(assignment.check_in));
  return { check_in: start, check_out: format(addDays(parseISO(start), nights), 'yyyy-MM-dd'), nights };
}
export function bedSwapCandidate(bookings: CalendarBookings, drag: CalendarDrag, bedId: number) {
  const matches = new Map<number, CalendarAssignment>();
  Object.entries(bookings[bedId] || {}).forEach(([day, assignment]) => {
    if (day >= drag.assignment.check_in && day < drag.assignment.check_out && assignment.booking_bed_id !== drag.assignment.booking_bed_id) matches.set(assignment.booking_bed_id, assignment);
  });
  return { assignment: matches.size === 1 ? [...matches.values()][0] : null, multiple: matches.size > 1 };
}
export function visibleMoveConflict(bookings: CalendarBookings, drag: CalendarDrag, bedId: number, start: string) {
  const stay = movedStay(drag.assignment, start);
  return Object.entries(bookings[bedId] || {}).some(([day, assignment]) =>
    day >= stay.check_in && day < stay.check_out && assignment.booking_bed_id !== drag.assignment.booking_bed_id);
}
export function freeBeds(rooms: Room[], bookings: CalendarBookings, date: Date) {
  const day = format(date, 'yyyy-MM-dd');
  return rooms.reduce((sum, room) => sum + room.beds.filter(bed => !bookings[bed.bed_id]?.[day]).length, 0);
}
export function dateShade(date: Date, today: string) {
  return format(date, 'yyyy-MM-dd') === today ? 'bg-indigo-50' : isWeekend(date) ? 'bg-slate-50' : 'bg-white';
}
