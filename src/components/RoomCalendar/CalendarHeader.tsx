import { format, addDays, parseISO } from 'date-fns';
import { dateShade } from '@/lib/calendarUtils';
export default function CalendarHeader({ dates, today }: { dates: Date[]; today: string }) {
  return <>{dates.map(date => {
    const yesterday = format(addDays(parseISO(today), -1), 'yyyy-MM-dd');
    const day = format(date, 'yyyy-MM-dd');
    return <div key={day} aria-current={day === today ? 'date' : undefined}
      className={`border-l border-slate-200 p-2 text-center text-sm ${dateShade(date, today)}`}>
      <div className="text-xs text-slate-500">{format(date, 'EEE')}</div>
      <div className={day === today ? 'font-bold text-indigo-700' : 'font-medium text-slate-700'}>{format(date, 'dd MMM')}</div>
      {(day === today || day === yesterday) && <div className={`text-xs ${day === today ? 'text-indigo-700' : 'text-slate-500'}`}>{day === today ? 'Today' : 'Yesterday'}</div>}
    </div>;
  })}</>;
}
