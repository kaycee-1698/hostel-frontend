import { format } from '@/lib/dateUtils';

export default function CalendarHeader({ dates }: { dates: Date[] }) {
  return (
    <>
      {dates.map((date, i) => (
        <div
          key={i}
          className="border-l border-gray-300 p-2 text-center text-sm font-medium bg-gray-50 text-gray-700"
        >
          {format(date, 'dd MMM')}
        </div>
      ))}
    </>
  );
}
