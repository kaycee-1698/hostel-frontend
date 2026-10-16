'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { deleteBooking } from '@/lib/api';
import { BookingSort, BookingView, QuickView, ColumnFilters, hostelToday, quickBookingView, outstandingAmount, filterBookings, initialBookingView, sortBookings } from '@/lib/bookingFilters';
import BookingsTable from './BookingsTable';
import AddBookingModal from './AddBookingModal';
import BookingFilters from './BookingFilters';

export default function BookingsDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<BookingView>(initialBookingView);
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [sort, setSort] = useState<BookingSort>(null);
  const { bookings, fetchBookings, isLoading, fetchError } = useBookings();
  const visibleBookings = useMemo(() => sortBookings(filterBookings(bookings, view, filters), sort), [bookings, view, filters, sort]);

  // Keep today's view current across midnight and when returning to the tab.
  useEffect(() => {
    const refreshDay = () => setView(previous => {
      const today = hostelToday();
      return previous.today === today ? previous : { ...previous, today };
    });
    refreshDay();
    const timer = window.setInterval(refreshDay, 60000);
    window.addEventListener('focus', refreshDay);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refreshDay); };
  }, []);
  const today = view.today || hostelToday();
  const counts = {
    arrivals: filterBookings(bookings, quickBookingView('arrivals', today), {}).length,
    outstanding: filterBookings(bookings, quickBookingView('outstanding', today), {}).length,
  };
  const chooseQuickView = (quickView: QuickView | null) => {
    setView(quickView ? quickBookingView(quickView, today) : initialBookingView());
    setFilters({});
    setSort(quickView === 'outstanding' ? { key: 'pending_amount', direction: 'desc' } : quickView === 'arrivals' ? { key: 'booking_name', direction: 'asc' } : null);
  };
  const balance = visibleBookings.reduce((total, booking) => total + outstandingAmount(booking), 0);
  const guests = visibleBookings.reduce((total, booking) => total + (Number(booking.number_of_adults) || 0), 0);

  const clearAll = () => {
    setView({ ...initialBookingView(), period: 'all' });
    setFilters({});
    setSort(null);
  };
  const handleDelete = async (ids: number[]) => {
    // The table confirms once. Refresh even if one delete fails.
    try { for (const id of ids) await deleteBooking(id); }
    finally { await fetchBookings(); }
  };
  const handleSuccess = async () => {
    await fetchBookings();
    setIsModalOpen(false);
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold tracking-tight text-slate-900">Bookings</h1><p className="mt-1 text-sm text-slate-500">Find, review and manage your reservations.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">+ Add booking</button>
      </div>
      <BookingFilters values={view} onChange={setView} onClear={clearAll} onQuickView={chooseQuickView} counts={counts} />
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600" aria-label="Current view summary">
        <span>Guests in view <strong className="ml-1 text-slate-900">{isLoading ? '…' : guests}</strong></span>
        <span>Outstanding in view <strong className="ml-1 text-slate-900">{isLoading ? '…' : `₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}</strong></span>
        <button type="button" disabled={isLoading} onClick={() => void fetchBookings().catch(() => {})} className="ml-auto rounded-lg px-3 py-1.5 font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{isLoading ? 'Refreshing…' : 'Refresh bookings'}</button>
      </div>
      {fetchError && <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        <span>Could not refresh bookings. {bookings.length > 0 ? 'Showing the last loaded data.' : 'Please try again.'}</span>
        <button type="button" onClick={() => void fetchBookings().catch(() => {})} className="font-medium underline">Retry</button>
      </div>}
      {isLoading && !bookings.length ? <p role="status" className="py-12 text-center text-sm text-slate-500">Loading bookings…</p> : !fetchError || bookings.length > 0 ? <BookingsTable bookings={visibleBookings} allBookings={bookings} view={view} filters={filters} sort={sort}
        onFilter={(key, filter) => setFilters(previous => {
          const next = { ...previous };
          if (filter) next[key] = filter; else delete next[key];
          return next;
        })}
        onSort={setSort} onClear={clearAll} onDelete={handleDelete} onSaved={fetchBookings} /> : null}
      <AddBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
    </div>
  );
}
