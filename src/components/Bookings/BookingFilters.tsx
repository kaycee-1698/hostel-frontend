'use client';

import { BookingView, QuickView, currentMonth } from '@/lib/bookingFilters';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  values: BookingView;
  onChange: (values: BookingView) => void;
  onClear: () => void;
  onQuickView: (view: QuickView | null) => void;
  counts: { arrivals: number; outstanding: number };
}
const control = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export default function BookingFilters({ values, onChange, onClear, onQuickView, counts }: Props) {
  return (
    <section aria-label="Booking search and month" className="mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div role="group" aria-label="Quick booking views" className="mb-4 flex flex-wrap gap-2">
        {([{ key: null, label: 'Browse bookings' }, { key: 'arrivals', label: 'Arrivals today' }, { key: 'outstanding', label: 'Outstanding payments' }] as const).map(item => (
          <button key={item.label} type="button" aria-pressed={(values.quickView || null) === item.key} onClick={() => onQuickView(item.key)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${(values.quickView || null) === item.key ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700'}`}>
            {item.label}{item.key && <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs tabular-nums">{counts[item.key]}</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Search bookings</span>
          <span className="relative block">
            <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input type="search" value={values.search} onChange={event => onChange({ ...values, search: event.target.value })}
              placeholder="Booking name or contact number" className={`${control} pl-9`} />
          </span>
        </label>
        <label className="w-full sm:w-44">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Check-in month</span>
          <select className={control} value={values.quickView === 'arrivals' ? 'today' : values.period} onChange={event => {
            const period = event.target.value as BookingView['period'];
            if (period === 'all') onClear();
            else onChange({ ...values, quickView: undefined, period, month: period === 'current' ? currentMonth() : values.month || currentMonth() });
          }}>
            {values.quickView === 'arrivals' && <option value="today" disabled>Today (India time)</option>}
            <option value="current">This month</option>
            <option value="custom">Choose month / year</option>
            <option value="all">All bookings</option>
          </select>
        </label>
        {values.period === 'custom' && (
          <label className="w-full sm:w-44">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Month and year</span>
            <input type="month" value={values.month} required className={control}
              onChange={event => { if (event.target.value) onChange({ ...values, month: event.target.value }); }} />
          </label>
        )}
        <button type="button" onClick={onClear} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500">
          <ArrowPathIcon aria-hidden="true" className="h-4 w-4" /> View all / clear filters
        </button>
      </div>
      <p className="mt-2.5 text-xs text-slate-500">{values.quickView === 'arrivals' ? 'Scheduled check-ins today, using India time. This includes guests who may already have checked in.' : values.quickView === 'outstanding' ? 'All dates · balances above ₹5, matching the existing payment rule. Search or use column filters to narrow the list.' : 'Month views use the check-in date. Use the column menus below for more filters and sorting.'}</p>
    </section>
  );
}
