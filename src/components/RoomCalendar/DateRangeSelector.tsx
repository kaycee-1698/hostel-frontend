import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';

export default function DateRangeSelector({ startDate, endDate, onChange }: {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}) {
  const [error, setError] = useState('');
  const change = (value: string, field: 'start' | 'end') => {
    const date = parseISO(value);
    if (!isValid(date)) {
      setError('Choose both a start and end date.');
      return;
    }
    const start = field === 'start' ? date : startDate;
    const end = field === 'end' ? date : endDate;
    if (start > end) {
      setError('The end date must be on or after the start date.');
      return;
    }
    setError('');
    onChange(start, end);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-4 items-center">
        <label>From: <input type="date" required
          value={format(startDate, 'yyyy-MM-dd')}
          max={format(endDate, 'yyyy-MM-dd')}
          aria-describedby="calendar-range-help"
          onChange={(e) => change(e.target.value, 'start')} /></label>
        <label>To: <input type="date" required
          value={format(endDate, 'yyyy-MM-dd')}
          min={format(startDate, 'yyyy-MM-dd')}
          aria-describedby="calendar-range-help"
          onChange={(e) => change(e.target.value, 'end')} /></label>
      </div>
      <p id="calendar-range-help" className="mt-1 text-xs text-gray-600">Both dates are included.</p>
      {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
