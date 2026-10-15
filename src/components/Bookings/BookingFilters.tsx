'use client';

import { Booking } from '@/types';

export type BookingFilterValues = {
  search: string;
  ota: string;
  paymentStatus: string;
  checkInFrom: string;
  checkInTo: string;
};

type BookingFiltersProps = {
  bookings: Booking[];
  values: BookingFilterValues;
  onChange: (values: BookingFilterValues) => void;
  onClear: () => void;
};

export const emptyBookingFilters: BookingFilterValues = {
  search: '',
  ota: '',
  paymentStatus: '',
  checkInFrom: '',
  checkInTo: '',
};

export default function BookingFilters({ bookings, values, onChange, onClear }: BookingFiltersProps) {
  const otaOptions = [...new Set(bookings.map((booking) => booking.ota_name).filter(Boolean))].sort();
  const paymentStatuses = [...new Set(bookings.map((booking) => booking.payment_status).filter(Boolean))].sort();
  const hasFilters = Object.values(values).some(Boolean);

  const update = (field: keyof BookingFilterValues, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="lg:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">Search</span>
          <input type="search" value={values.search} onChange={(event) => update('search', event.target.value)} placeholder="Booking name or contact number" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">OTA</span>
          <select value={values.ota} onChange={(event) => update('ota', event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            <option value="">All OTAs</option>
            {otaOptions.map((ota) => <option key={ota} value={ota}>{ota}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Payment status</span>
          <select value={values.paymentStatus} onChange={(event) => update('paymentStatus', event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            <option value="">All statuses</option>
            {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" onClick={onClear} disabled={!hasFilters} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">Clear filters</button>
        </div>
        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Check-in from</span>
          <input type="date" value={values.checkInFrom} onChange={(event) => update('checkInFrom', event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Check-in to</span>
          <input type="date" value={values.checkInTo} min={values.checkInFrom || undefined} onChange={(event) => update('checkInTo', event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </label>
      </div>
    </div>
  );
}
