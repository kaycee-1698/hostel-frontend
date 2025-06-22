'use client';

import React, { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import BookingsTable from './BookingsTable';
import AddBookingModal from './AddBookingModal';

export default function BookingsDashboard() {

  const [isModalOpen, setIsModalOpen] = useState(false);
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

      <BookingsTable
        bookings={bookings}
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

