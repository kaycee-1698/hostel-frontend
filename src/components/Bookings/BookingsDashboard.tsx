'use client';
import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import CreateBookingForm from './CreateBookingForm';
import BookingsTable from './BookingsTable';
import { Booking } from '@/types';

export default function BookingsDashboard() {
  const {
    bookings,
    removeBooking,
    updateSingleBooking,
    addNewBooking,
  } = useBookings();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSave = async (id: number) => {
    if (!editedBooking) return;
    await updateSingleBooking(id, editedBooking);
    setEditingId(null);
    setEditedBooking(null);
  };

  return (
    <div className="w-full">
      <CreateBookingForm onCreate={addNewBooking} />
      <BookingsTable
        bookings={bookings}
        loadingId={loadingId}
        setLoadingId={setLoadingId}
        editingId={editingId}
        editedBooking={editedBooking}
        setEditingId={setEditingId}
        setEditedBooking={setEditedBooking}
        onDelete={removeBooking}
        onSave={handleSave}
        onCancel={() => {
          setEditingId(null);
          setEditedBooking(null);
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const { name, value } = e.target;
          setEditedBooking(prev =>
            prev
              ? {
                  ...prev,
                  [name]: ['base_amount', 'number_of_adults'].includes(name)
                    ? Number(value)
                    : value,
                }
              : null
          );
        }}
      />
    </div>
  );
}
