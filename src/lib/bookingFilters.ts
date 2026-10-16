import { Booking } from '@/types';

export const bookingColumns = [
  { key: 'booking_name', label: 'Booking name', type: 'text' },
  { key: 'ota_name', label: 'OTA', type: 'text' },
  { key: 'number_of_adults', label: 'Adults', type: 'number' },
  { key: 'contact_number', label: 'Contact', type: 'text' },
  { key: 'check_in', label: 'Check-in', type: 'date' },
  { key: 'check_out', label: 'Check-out', type: 'date' },
  { key: 'number_of_nights', label: 'Nights', type: 'number' },
  { key: 'pending_amount', label: 'Pending ₹', type: 'number' },
  { key: 'payment_status', label: 'Status', type: 'text' },
  { key: 'bank', label: 'Bank', type: 'text' },
] as const;
export type BookingColumn = typeof bookingColumns[number];
export type ColumnKey = BookingColumn['key'];
export const dateOperators = [
  { value: 'before', label: 'Before' },
  { value: 'beforeOrOn', label: 'Before or on' },
  { value: 'on', label: 'On' },
  { value: 'onOrAfter', label: 'On or after' },
  { value: 'after', label: 'After' },
] as const;
export type DateOperator = typeof dateOperators[number]['value'];
export type ColumnFilter = { kind: 'values'; values: string[] } |
  { kind: 'date'; operator: DateOperator; date: string };
export type ColumnFilters = Partial<Record<ColumnKey, ColumnFilter>>;
export type BookingSort = { key: ColumnKey; direction: 'asc' | 'desc' } | null;
export type QuickView = 'arrivals' | 'outstanding';
export type BookingView = { search: string; period: 'current' | 'custom' | 'all'; month: string; quickView?: QuickView; today?: string };

export function hostelToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => parts.find(item => item.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
// Match the backend's existing ₹5 paid-balance tolerance.
export function outstandingAmount(booking: Booking) {
  const amount = Number(booking.pending_amount);
  return Number.isFinite(amount) && amount > 5 ? amount : 0;
}
export function quickBookingView(quickView: QuickView, today = hostelToday()): BookingView {
  return { search: '', period: 'all', month: today.slice(0, 7), quickView, today };
}

export function currentMonth(now = new Date()) {
  return hostelToday(now).slice(0, 7);
}
export function initialBookingView(): BookingView {
  return { search: '', period: 'current', month: currentMonth() };
}
export function cellValue(booking: Booking, key: ColumnKey): string {
  const value = booking[key];
  if (value == null || value === '') return '';
  if (key === 'check_in' || key === 'check_out') return String(value).slice(0, 10);
  if (bookingColumns.find(column => column.key === key)?.type === 'number') {
    return Number.isFinite(Number(value)) ? String(Number(value)) : '';
  }
  return String(value);
}
export function formatValue(value: string, column: BookingColumn) {
  if (value === '') return '(Blank)';
  if (column.type === 'date') {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
  if (column.key === 'pending_amount') return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  return value;
}
export function matchesDate(value: string, operator: DateOperator, date: string) {
  if (!value || !date) return false;
  switch (operator) {
    case 'before': return value < date;
    case 'beforeOrOn': return value <= date;
    case 'on': return value === date;
    case 'onOrAfter': return value >= date;
    case 'after': return value > date;
  }
}
export function filterBookings(bookings: Booking[], view: BookingView, filters: ColumnFilters, omit?: ColumnKey) {
  const query = view.search.trim().toLocaleLowerCase();
  const digits = query.replace(/\D/g, '');
  const phoneQuery = /^[+\d\s().-]+$/.test(query) && digits.length > 0;
  const month = view.period === 'current' ? currentMonth() : view.month;
  return bookings.filter(booking => {
    if (view.quickView === 'arrivals' && cellValue(booking, 'check_in') !== (view.today || hostelToday())) return false;
    if (view.quickView === 'outstanding' && !outstandingAmount(booking)) return false;
    const name = cellValue(booking, 'booking_name').toLocaleLowerCase();
    const contact = cellValue(booking, 'contact_number');
    if (query && !name.includes(query) && !contact.toLocaleLowerCase().includes(query) &&
      !(phoneQuery && contact.replace(/\D/g, '').includes(digits))) return false;
    if (view.period !== 'all' && cellValue(booking, 'check_in').slice(0, 7) !== month) return false;
    return bookingColumns.every(column => {
      if (column.key === omit) return true;
      const filter = filters[column.key];
      if (!filter) return true;
      const value = cellValue(booking, column.key);
      return filter.kind === 'values' ? filter.values.includes(value) : matchesDate(value, filter.operator, filter.date);
    });
  });
}
export function compareValues(a: string, b: string, type: BookingColumn['type']) {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return type === 'number' ? Number(a) - Number(b) : a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
export function sortBookings(bookings: Booking[], sort: BookingSort) {
  if (!sort) return bookings;
  const column = bookingColumns.find(column => column.key === sort.key)!;
  return [...bookings].sort((a, b) => {
    const av = cellValue(a, sort.key), bv = cellValue(b, sort.key);
    // Blank cells stay at the bottom in both directions.
    if (!av || !bv) return compareValues(av, bv, column.type);
    return compareValues(av, bv, column.type) * (sort.direction === 'asc' ? 1 : -1);
  });
}
export function columnOptions(bookings: Booking[], view: BookingView, filters: ColumnFilters, column: BookingColumn) {
  const values = filterBookings(bookings, view, filters, column.key).map(booking => cellValue(booking, column.key));
  const selected = filters[column.key];
  if (selected?.kind === 'values') values.push(...selected.values);
  return [...new Set(values)].sort((a, b) => compareValues(a, b, column.type));
}
export function filterDescription(column: BookingColumn, filter: ColumnFilter) {
  if (filter.kind === 'date') return `${dateOperators.find(op => op.value === filter.operator)?.label} ${formatValue(filter.date, column)}`;
  if (!filter.values.length) return 'No values selected';
  const first = formatValue(filter.values[0], column);
  return filter.values.length === 1 ? first : `${first} +${filter.values.length - 1}`;
}
