'use client';

import React, { useState, useEffect } from 'react';
import { Booking } from '@/types';
import { useBookings } from '@/hooks/useBookings';
import BookingDetailsModal from './BookingDetailsModal';
import BookingsTable from './BookingsTable';
import CreateBookingForm from './CreateBookingForm';

export default function BookingsDashboard() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Use the custom hook to fetch bookings and handle adding/editing
  const {
    bookings,
    removeBooking,
    updateSingleBooking,
    addNewBooking,
  } = useBookings();

  const handleSaveBooking = async (updatedBooking: Booking) => {
    const saved = await updateSingleBooking(updatedBooking.booking_id, updatedBooking);
    return saved; // Return the updated booking for further processing if needed
  };

  const handleDeleteBooking = async(id: number) => {
    removeBooking(id);
  };

  const handleBookingAdded = async (newBooking: Booking) => {
    addNewBooking(newBooking);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Bookings Dashboard</h1>
        {/*<button onClick={() => setShowAddModal(true)}>Add Booking</button>*/}
      </div>

      <BookingsTable
        bookings={bookings}
        onSave={handleSaveBooking}
        onDelete={handleDeleteBooking}
      />

    </div>
    
  );
}

