'use client';
import { Booking } from '@/types';

export default function BookingRow({
  index,
  booking,
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
  onRowClick,
}: {
  index: number;
  booking: Booking;
  loadingId: string | null;
  setLoadingId: (id: string | null) => void;
  editingId: number | null;
  editedBooking: Booking | null;
  setEditingId: (id: number | null) => void;
  setEditedBooking: (b: Booking) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRowClick: (booking: Booking) => void;
}) {
  const isEditing = editingId === booking.booking_id;

  return (
    <tr className="hover:bg-gray-50" onClick={() => onRowClick(booking)}>
      <td className="px-3 py-2 text-sm">{index + 1}</td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="booking_name"
            value={editedBooking?.booking_name || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          booking.booking_name
        )}
      </td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="ota_name"
            value={editedBooking?.ota_name || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          booking.ota_name
        )}
      </td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="number_of_adults"
            type="number"
            value={editedBooking?.number_of_adults || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          booking.number_of_adults
        )}
      </td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="contact_number"
            value={editedBooking?.contact_number || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          booking.contact_number
        )}
      </td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="check_in"
            type="date"
            value={editedBooking?.check_in || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          new Date(booking.check_in).toLocaleDateString()
        )}
      </td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="check_out"
            type="date"
            value={editedBooking?.check_out || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          new Date(booking.check_out).toLocaleDateString()
        )}
      </td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="base_amount"
            type="number"
            value={editedBooking?.base_amount || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          `₹${booking.base_amount}`
        )}
      </td>
      <td className="px-3 py-2 text-sm">₹{booking.commission}</td>
      <td className="px-3 py-2 text-sm">₹{booking.gst}</td>
      <td className="px-3 py-2 text-sm">
        {isEditing ? (
          <input
            name="payment_received"
            type="number"
            value={editedBooking?.payment_received || ''}
            onChange={onChange}
            className="border p-1 rounded w-full text-sm"
          />
        ) : (
          `₹${booking.payment_received}`
        )}
      </td>
      <td className="px-3 py-2 text-sm">₹{booking.pending_amount}</td>
      <td className="px-3 py-2 text-sm">₹{booking.pending_amount + booking.payment_received}</td>
      <td className="px-3 py-2 text-sm flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(booking.booking_id);
                setEditedBooking(booking);
              }}
              className="text-yellow-600 hover:text-yellow-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(booking.booking_id);
              }}
              disabled={loadingId === String(booking.booking_id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </>
        )}
      </td>
      <td className="px-3 py-2 text-sm">{booking.payment_status}</td>
      <td className="px-3 py-2 text-sm">{booking.profit_after_commission}</td>
      <td className="px-3 py-2 text-sm">{booking.bank}</td>
    </tr>
  );
}
