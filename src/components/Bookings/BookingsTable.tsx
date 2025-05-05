import { Booking } from '@/types';
import React, { useState } from 'react';
import BookingRow from './BookingRow';
import BookingDetailsModal from './BookingDetailsModal';

export default function BookingsTable({
  bookings,
  loadingId,
  setLoadingId,
  editingId,
  editedBooking,
  setEditingId,
  setEditedBooking,
  onDelete,
  onSave,
  onCancel,
  onChange,
}: {
  bookings: Booking[];
  loadingId: string | null;
  setLoadingId: (id: string | null) => void;
  editingId: number | null;
  editedBooking: Booking | null;
  setEditingId: (id: number | null) => void;
  setEditedBooking: (b: Booking | null) => void;
  onDelete: (id: number) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {

const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };


  return (
    <div className="overflow-x-auto max-h-[500px]">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Sr.</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Guest</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">OTA</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Adults</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Contact</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Check-In</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Check-Out</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Base ₹</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Commission ₹</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">GST ₹</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Paid ₹</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Pending ₹</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Total ₹</th>
            <th className="px-3 py-2 text-sm font-medium text-gray-700">Actions</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Status</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">PAC</th>
            <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Bank</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => (
            <BookingRow
              key={booking.booking_id}
              index={index}
              booking={booking}
              loadingId={loadingId}
              setLoadingId={setLoadingId}
              editingId={editingId}
              editedBooking={editedBooking}
              setEditingId={setEditingId}
              setEditedBooking={setEditedBooking}
              onDelete={onDelete}
              onSave={() => onSave(booking.booking_id)}
              onCancel={onCancel}
              onChange={onChange}
              onRowClick={() => openModal(booking)} // Open modal on row click
            />
          ))}
        </tbody>
      </table>
      <BookingDetailsModal
        isOpen={isModalOpen}
        booking={selectedBooking}
        onClose={closeModal}
        onSave={(updatedBooking) => {
          if (updatedBooking.booking_id) {
            onSave(updatedBooking.booking_id);
          }
        }}
      />
    </div>
  );
}
