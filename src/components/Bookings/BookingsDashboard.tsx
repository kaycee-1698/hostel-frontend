'use client';

import React, { useState } from 'react';
import { Booking } from '@/types';
import { useBookings } from '@/hooks/useBookings';
import BookingsTable from './BookingsTable';
import AddBookingModal from './AddBookingModal';
import BookingFilters, { BookingFilterValues, emptyBookingFilters } from './BookingFilters';

export default function BookingsDashboard() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<BookingFilterValues>(emptyBookingFilters);
  const {
    bookings,
    removeBooking,
    fetchBookings,
  } = useBookings();

  const handleDeleteBooking = async(id: number) => {
    removeBooking(id);
  };

  const handleSuccess = async () => {
    await fetchBookings();
    setIsModalOpen(false);
  };

  const filteredBookings = bookings.filter((booking: Booking) => {
    const search = filters.search.trim().toLowerCase();
    const matchesSearch = !search || booking.booking_name?.toLowerCase().includes(search) || booking.contact_number?.toLowerCase().includes(search);
    const matchesOta = !filters.ota || booking.ota_name === filters.ota;
    const matchesPaymentStatus = !filters.paymentStatus || booking.payment_status === filters.paymentStatus;
    const matchesStartDate = !filters.checkInFrom || booking.check_in >= filters.checkInFrom;
    const matchesEndDate = !filters.checkInTo || booking.check_in <= filters.checkInTo;
    return matchesSearch && matchesOta && matchesPaymentStatus && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Bookings Dashboard</h1>
        <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
                >
                + Add Booking
            </button>
      </div>

      <BookingFilters bookings={bookings} values={filters} onChange={setFilters} onClear={() => setFilters(emptyBookingFilters)} />
      <p className="mb-2 text-sm text-gray-600">Showing {filteredBookings.length} of {bookings.length} bookings</p>

      <BookingsTable
        bookings={filteredBookings}
        onDelete={handleDeleteBooking}
      />
      <AddBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

    </div>
    
  );
}
