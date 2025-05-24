'use client';

import React, { useEffect, useState } from 'react';
import { Booking } from '@/types';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSave: (updatedBooking: Booking) => void;
}

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onSave,
}: BookingDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setEditedBooking(booking);
    setIsEditing(false);
  }, [booking]);

  if (!isOpen || !editedBooking || booking === null) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;

    setEditedBooking(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]:
          type === 'number'
            ? value === '' ? '' : parseFloat(value)  // allow blank for typing
            : value,
      };
    });
  };

  const handleSave = () => {
    if (editedBooking) {
      onSave(editedBooking);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedBooking(booking);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex">
            <div className="w-1/2">
              <div className="mb-2">
                <strong>Booking name:</strong>{' '}
                {isEditing ? (
                  <input
                    name="booking_name"
                    value={editedBooking.booking_name || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  booking?.booking_name
                )}
              </div>
              <div className="mb-2">
                <strong>OTA:</strong>{' '}
                {isEditing ? (
                  <input
                    name="ota_name"
                    value={editedBooking.ota_name || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  booking?.ota_name
                )}
              </div>
              <div className="mb-2">
                <strong>Number of Adults:</strong>{' '}
                {isEditing ? (
                  <input
                    name="number_of_adults"
                    type="number"
                    value={editedBooking.number_of_adults || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  booking?.number_of_adults
                )}
              </div>
              <div className="mb-2">
                <strong>Contact Number:</strong>{' '}
                {isEditing ? (
                  <input
                    name="contact_number"
                    value={editedBooking.contact_number || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  booking?.contact_number
                )}
              </div>
              <div className="mb-2">
                <strong>Check-In Date:</strong>{' '}
                {isEditing ? (
                  <input
                    name="check_in"
                    type="date"
                    value={editedBooking.check_in?.substring(0, 10) || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  new Date(booking.check_in).toLocaleDateString()
                )}
              </div>
              <div className="mb-2">
                <strong>Check-Out Date:</strong>{' '}
                {isEditing ? (
                  <input
                    name="check_out"
                    type="date"
                    value={editedBooking.check_out?.substring(0, 10) || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  new Date(booking.check_out).toLocaleDateString()
                )}
              </div>
              <div className="mb-2">
                ({booking.number_of_nights} night{booking.number_of_nights > 1 ? 's' : ''})
              </div>
            </div>

            <div className="w-1/2 pl-4">
              <div className="mb-2">
                <strong>Base Amount:</strong>{' '}
                {isEditing ? (
                  <input
                    name="base_amount"
                    type="number"
                    value={editedBooking.base_amount || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  `₹${booking.base_amount}`
                )}
              </div>
              <div className="mb-2">
                <strong>Commission:</strong> ₹{booking.commission}
              </div>
              <div className="mb-2">
                <strong>GST:</strong> ₹{booking.gst}
              </div>
              <div className="mb-2">
                <strong>Paid Amount:</strong>{' '}
                {isEditing ? (
                  <input
                  name="payment_received"
                  type="number"
                  value={
                    editedBooking.payment_received ?? ''  // fallback to empty string
                  }
                  onChange={handleInputChange}
                  className="border p-1 rounded w-full"
                />
                ) : (
                  `₹${booking.payment_received}`
                )}
              </div>
              <div className="mb-2">
                <strong>Pending Amount:</strong> ₹{booking.pending_amount}
              </div>
              <div className="mb-2">
                <strong>Total Payment:</strong>{' '}
                ₹{booking.pending_amount + booking.payment_received}
              </div>
              <div className="mb-2">
                <strong>Bank:</strong>{' '}
                {isEditing ? (
                  <input
                    name="bank"
                    value={editedBooking.bank || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  booking.bank
                )}
              </div>
              <div className="mb-2">
                <strong>Other info:</strong>{' '}
                {isEditing ? (
                  <input
                    name="bank"
                    value={editedBooking.other_info || ''}
                    onChange={handleInputChange}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  booking.other_info
                )}
              </div>
            </div>
          </div>
          <div className="mb-6">
            <div className="text-lg font-semibold mb-2">Assigned Rooms & Beds</div>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="grid grid-cols-3 bg-gray-100 text-sm font-medium text-gray-700 px-4 py-2">
                <div><strong>Adult</strong></div>
                <div><strong>Room</strong></div>
                <div><strong>Bed</strong></div>
              </div>
              {editedBooking.rooms
                ?.flatMap((room) =>
                  room.beds.map((bed) => ({
                    bed,
                    room_name: room.room_name,
                  }))
                )
                .map(({ bed, room_name }, i) => (
                  <div
                    key={bed.booking_bed_id}
                    className="grid grid-cols-3 items-center text-sm px-4 py-2 even:bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="text-gray-800">Adult {i + 1}</div>
                    <div className="text-gray-600">{room_name}</div>
                    <div className="text-gray-600">{bed.bed_name}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 mr-2"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ml-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

