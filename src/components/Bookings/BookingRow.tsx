import React from 'react';
import { Booking } from '@/types';

interface BookingRowProps {
  index: number;
  booking: Booking;
  isHovered: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onRowClick: () => void;
}

export default function BookingRow({
  index,
  booking,
  isHovered,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onMouseEnter,
  onMouseLeave,
  onRowClick,
}: BookingRowProps) {
  return (
    <tr
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onRowClick}
      className="hover:bg-blue-50 transition cursor-pointer group"
    >
      <td className="px-4 py-2 w-10">
        {(isSelectMode || isHovered) ? (
          <input
            type="checkbox"
            className="h-5 w-5 cursor-pointer"
            checked={isSelected}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onToggleSelect()}
          />
        ) : (
          <span>{index + 1}</span>
        )}
      </td>
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
  </tr>
  );
}
