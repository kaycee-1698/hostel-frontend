import React, { useState, useEffect } from 'react';
import { Booking } from '@/types';
import BookingRow from './BookingRow';
import BookingDetailsModal from './BookingDetailsModal';

interface BookingsTableProps {
  bookings: Booking[];
  onSave: (updatedBooking: Booking) => Promise<Booking>;
  onDelete: (id: number) => void;
}

export default function BookingsTable({ bookings, onSave, onDelete }: BookingsTableProps) {
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null); // Store selected booking
  const [isModalOpen, setIsModalOpen] = useState(false); // Control modal visibility

  // Update localBookings whenever the bookings prop changes
  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  const handleSaveBooking = async (updatedBooking: Booking) => {
    try {
      // Send updatedBooking to API via onSave and await response
      const savedBooking: Booking = await onSave(updatedBooking); // Ensure onSave returns a Booking object
  
      const updatedBookings = localBookings.map((booking) =>
        booking.booking_id === savedBooking.booking_id ? savedBooking : booking
      );
      setLocalBookings(updatedBookings);
  
      // ✅ Set the full, recalculated booking in the modal
      setSelectedBooking(savedBooking);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };


  const handleDeleteBooking = (id: number) => {
    // Delete the booking locally
    const updatedBookings = localBookings.filter((booking) => booking.booking_id !== id);
    setLocalBookings(updatedBookings);
    onDelete(id); // Call the onDelete function passed from the parent
    setSelectedBooking(null); // Close modal on delete
  };

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100 text-gray-700 text-sm">
          <tr>
            {[
              "Booking Name",
              "OTA",
              "Adults",
              "Contact",
              "Check-In",
              "Check-Out",
              "Nights",
              "Pending ₹",
              "Status",
              "Bank",
              "Actions",
            ].map((header) => (
              <th key={header} className="px-4 py-3 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-100">
          {localBookings.map((booking) => (
            <BookingRow
              key={booking.booking_id}
              booking={booking}
              onSave={handleSaveBooking}
              onDelete={handleDeleteBooking}
              onRowClick={() => openModal(booking)}
            />
          ))}
        </tbody>
      </table>


      {/* Render the modal outside the table, controlled by isModalOpen */}
      {isModalOpen && selectedBooking && (
        <BookingDetailsModal
          isOpen={!!selectedBooking}
          booking={selectedBooking}
          onSave={handleSaveBooking}
          onClose={closeModal} // Close the modal when needed
        />
      )}
    </div>
  );
}
