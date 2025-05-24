'use client';

import React, { useState } from 'react';
import { Booking } from '@/types';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import BookingsTable from './BookingsTable';
import AddBookingModal from './AddBookingModal';

export default function BookingsDashboard() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    bookings,
    removeBooking,
    updateSingleBooking,
    fetchBookings,
  } = useBookings();
  const { rooms } = useRooms();

  const handleSaveBooking = async (updatedBooking: Booking) => {
    const saved = await updateSingleBooking(updatedBooking.booking_id, updatedBooking);
    return saved; // Return the updated booking for further processing if needed
  };

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
        onSave={handleSaveBooking}
        onDelete={handleDeleteBooking}
      />
      <AddBookingModal
        isOpen={isModalOpen}
        rooms={rooms}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

    </div>
    
  );
}

