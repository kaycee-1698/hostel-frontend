import { format } from 'date-fns';

export default function DateRangeSelector({
  startDate,
  endDate,
  onChange,
}: {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}) {
  return (
    <div className="flex gap-4 items-center">
      <label>
        From:{' '}
        <input
          type="date"
          value={format(startDate, 'yyyy-MM-dd')}
          onChange={(e) => onChange(new Date(e.target.value), endDate)}
        />
      </label>
      <label>
        To:{' '}
        <input
          type="date"
          value={format(endDate, 'yyyy-MM-dd')}
          onChange={(e) => onChange(startDate, new Date(e.target.value))}
        />
      </label>
    </div>
  );
}
