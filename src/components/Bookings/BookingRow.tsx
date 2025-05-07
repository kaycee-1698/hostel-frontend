import React from 'react';
import { Booking } from '@/types';

interface BookingRowProps {
  booking: Booking;
  onSave: (updatedBooking: Booking) => void;
  onDelete: (id: number) => void;
  onRowClick: () => void; // Add the callback to open the modal
}

export default function BookingRow({
  booking,
  onSave,
  onDelete,
  onRowClick
}: BookingRowProps) {
  return (
    <tr className="hover:bg-blue-50 transition cursor-pointer group" onClick={onRowClick}>
      <td className="px-4 py-3">{booking.booking_name}</td>
      <td className="px-4 py-3">{booking.ota_name}</td>
      <td className="px-4 py-3">{booking.number_of_adults}</td>
      <td className="px-4 py-3">{booking.contact_number}</td>
      <td className="px-4 py-3 whitespace-nowrap">{booking.check_in}</td>
      <td className="px-4 py-3 whitespace-nowrap">{booking.check_out}</td>
      <td className="px-4 py-3">{booking.number_of_nights}</td>
      <td className="px-4 py-3 text-red-600 font-semibold">₹{booking.pending_amount}</td>
      <td className="px-4 py-3">{booking.payment_status}</td>
      <td className="px-4 py-3">{booking.bank}</td>
      <td className="px-4 py-3 text-red-500 hover:text-red-700"
        onClick={(e) => {
          e.stopPropagation(); // prevent row click from opening modal
          onDelete(booking.booking_id);
        }}
      >
        <button className="text-sm font-medium">Delete</button>
      </td>
  </tr>
  );
}
