'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Booking } from '@/types';
import { getBookingWithBedsAndRooms } from '@/lib/api';
import { bookingColumns, BookingColumn, BookingSort, BookingView, ColumnFilter, ColumnFilters, ColumnKey, columnOptions, filterDescription } from '@/lib/bookingFilters';
import BookingRow from './BookingRow';
import BookingDetailsModal from './BookingDetailsModal';
import ColumnFilterMenu from './ColumnFilterMenu';

interface Props {
  bookings: Booking[];
  allBookings: Booking[];
  view: BookingView;
  filters: ColumnFilters;
  sort: BookingSort;
  onFilter: (key: ColumnKey, filter?: ColumnFilter) => void;
  onSort: (sort: BookingSort) => void;
  onClear: () => void;
  onDelete: (ids: number[]) => Promise<void>;
  onSaved: () => Promise<void>;
}

export default function BookingsTable({ bookings, allBookings, view, filters, sort, onFilter, onSort, onClear, onDelete, onSaved }: Props) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openMenu, setOpenMenu] = useState<{ column: BookingColumn; anchor: HTMLButtonElement } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const selectAll = useRef<HTMLInputElement>(null);
  const openingRef = useRef(false);
  const visibleIds = new Set(bookings.map(booking => booking.booking_id));
  const selected = selectedIds.filter(id => visibleIds.has(id));
  const allSelected = bookings.length > 0 && selected.length === bookings.length;

  useEffect(() => {
    setSelectedIds(previous => previous.filter(id => bookings.some(booking => booking.booking_id === id)));
  }, [bookings]);
  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && !allSelected;
  }, [selected.length, allSelected]);

  const openBooking = async (id: number) => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    setError('');
    try { setSelectedBooking(await getBookingWithBedsAndRooms(id)); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not open booking.'); }
    finally { openingRef.current = false; setOpening(false); }
  };
  const saveBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    // Refresh the source data so edits also update filter choices and month membership.
    await onSaved();
  };
  const deleteSelected = async () => {
    setDeleting(true);
    setError('');
    try { await onDelete(selected); setSelectedIds([]); setShowConfirm(false); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not delete bookings.'); setShowConfirm(false); }
    finally { setDeleting(false); }
  };

  return (
    <section aria-label="Bookings table" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm text-slate-600"><span className="font-semibold text-slate-900">{bookings.length}</span> of {allBookings.length} bookings{opening && <span className="ml-3 text-indigo-600">Opening booking…</span>}</p>
        <span className="text-xs text-slate-500">Click a column heading to sort or filter</span>
      </div>
      {(Object.keys(filters).length > 0 || sort) && <div className="mb-3 flex flex-wrap gap-2" aria-label="Active table filters">
        {bookingColumns.map(column => {
          const filter = filters[column.key];
          return filter ? <button key={column.key} type="button" onClick={() => onFilter(column.key, undefined)}
            aria-label={`Remove ${column.label} filter`} title={`${column.label}: ${filterDescription(column, filter)} — click to remove`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-800 hover:bg-indigo-100">
            <span className="truncate"><span className="font-semibold">{column.label}:</span> {filterDescription(column, filter)}</span><XMarkIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          </button> : null;
        })}
        {sort && <button type="button" onClick={() => onSort(null)} aria-label="Remove sorting" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
          {sort.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
          {bookingColumns.find(column => column.key === sort.key)?.label}<XMarkIcon className="h-3.5 w-3.5" />
        </button>}
      </div>}
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {selected.length > 0 && <div className="mb-3 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm">
        <span className="font-medium text-indigo-900">{selected.length} selected <span className="font-normal text-indigo-700">· visible bookings only</span></span>
        <div className="flex gap-3"><button type="button" onClick={() => setSelectedIds([])} className="text-slate-600 hover:underline">Cancel</button><button type="button" onClick={() => setShowConfirm(true)} className="rounded-md bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-50">Delete selected</button></div>
      </div>}
      <div className="max-h-[68vh] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Bookings with column sorting and filters. Select a booking name to open its details.</caption>
          <thead className="text-xs text-slate-600">
            <tr>
              <th scope="col" className="sticky top-0 z-10 w-12 border-b border-slate-200 bg-slate-50 px-3 py-3 text-left">
                <input ref={selectAll} type="checkbox" checked={allSelected} disabled={!bookings.length} aria-label="Select all visible bookings"
                  onChange={() => setSelectedIds(allSelected ? [] : bookings.map(booking => booking.booking_id))} className="h-4 w-4 accent-indigo-600" />
              </th>
              {bookingColumns.map(column => {
                const active = !!filters[column.key];
                const direction = sort?.key === column.key ? sort.direction : null;
                return <th key={column.key} scope="col" aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
                  className={`sticky top-0 z-10 border-b border-slate-200 p-0 text-left font-medium ${active ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                  <button type="button" aria-haspopup="dialog" aria-expanded={openMenu?.column.key === column.key}
                    aria-label={`${column.label}: sort and filter${active ? ', filter applied' : ''}`}
                    onClick={event => setOpenMenu({ column, anchor: event.currentTarget })}
                    className={`flex w-full items-center justify-between gap-2 whitespace-nowrap px-3 py-3.5 text-left transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500 ${active ? 'text-indigo-800' : ''}`}>
                    <span>{column.label}</span>
                    <span className="flex items-center gap-1">
                      {direction === 'asc' ? <ArrowUpIcon aria-hidden="true" className="h-3.5 w-3.5" /> : direction === 'desc' ? <ArrowDownIcon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                      {active ? <FunnelIcon aria-hidden="true" className="h-3.5 w-3.5 text-indigo-600" /> : <ChevronDownIcon aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />}
                    </span>
                  </button>
                </th>;
              })}
            </tr>
          </thead>
          <tbody>
            {bookings.length ? bookings.map(booking => <BookingRow key={booking.booking_id} booking={booking}
              isSelected={selected.includes(booking.booking_id)}
              onToggleSelect={() => setSelectedIds(previous => previous.includes(booking.booking_id) ? previous.filter(id => id !== booking.booking_id) : [...previous, booking.booking_id])}
              onRowClick={() => void openBooking(booking.booking_id)} />) : <tr><td colSpan={11} className="px-5 py-16 text-center">
                <FunnelIcon aria-hidden="true" className="mx-auto mb-3 h-6 w-6 text-slate-300" />
                <p className="font-medium text-slate-800">No bookings match this view</p>
                <p className="mt-1 text-sm text-slate-500">Try another month, change a column filter, or clear all filters.</p>
                <button type="button" onClick={onClear} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-slate-50">View all bookings</button>
              </td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">Open a booking by clicking its name. Scroll sideways to see all columns.</p>
      {openMenu && <ColumnFilterMenu key={openMenu.column.key} {...openMenu} filter={filters[openMenu.column.key]} sort={sort}
        options={columnOptions(allBookings, view, filters, openMenu.column)}
        onFilter={filter => onFilter(openMenu.column.key, filter)}
        onSort={direction => onSort(direction ? { key: openMenu.column.key, direction } : null)} onClose={() => setOpenMenu(null)} />}
      {selectedBooking && <BookingDetailsModal isOpen booking={selectedBooking} onSave={saveBooking} onClose={() => setSelectedBooking(null)} />}
      {showConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
        <div role="alertdialog" aria-modal="true" aria-labelledby="delete-bookings-title" className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <h2 id="delete-bookings-title" className="font-semibold text-slate-900">Delete {selected.length} selected bookings?</h2>
          <p className="mt-2 text-sm text-slate-500">This cannot be undone. Only the selected bookings in the current view will be deleted.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" autoFocus disabled={deleting} onClick={() => setShowConfirm(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Cancel</button>
            <button type="button" disabled={deleting || !selected.length} onClick={() => void deleteSelected()} className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete bookings'}</button>
          </div>
        </div>
      </div>}
    </section>
  );
}
