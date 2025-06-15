'use client';

import React from 'react';
import { Booking } from '@/types';

interface BookingDetailsProps {
  booking: Booking;
}

export default function BookingDetails({
  booking,
}: BookingDetailsProps) {
  return (
    <div className="space-y-4">
          <div className="flex">
            <div className="w-1/2">
              <div className="mb-2">
                <strong>Booking name:</strong>{' '}{booking.booking_name}
              </div>
              <div className="mb-2">
                <strong>OTA:</strong>{' '}{booking.ota_name}
              </div>
              <div className="mb-2">
                <strong>Number of Adults:</strong>{' '}{booking.number_of_adults}
              </div>
              <div className="mb-2">
                <strong>Contact Number:</strong>{' '}{booking.contact_number}
              </div>
              <div className="mb-2">
                <strong>Check-In Date:</strong>{' '}
                {booking.check_in ? new Date(booking.check_in).toLocaleDateString() : '—'}
              </div>
              <div className="mb-2">
                <strong>Check-Out Date:</strong>{' '}
                {booking.check_out ? new Date(booking.check_out).toLocaleDateString() : '—'}
              </div>
              <div className="mb-2">
                ({booking.number_of_nights} night{booking.number_of_nights > 1 ? 's' : ''})
              </div>
            </div>
            <div className="w-1/2 pl-4">
              <div className="mb-2">
                <strong>Base Amount:</strong>{' '}₹{booking.base_amount}
              </div>
              <div className="mb-2">
                <strong>Commission:</strong>{' '}₹{booking.commission}
              </div>
              <div className="mb-2">
                <strong>GST:</strong>{' '}₹{booking.gst}
              </div>
              <div className="mb-2">
                <strong>Paid Amount:</strong>{' '}₹{booking.payment_received}
              </div>
              <div className="mb-2">
                <strong>Pending Amount:</strong> ₹{booking.pending_amount}
              </div>
              <div className="mb-2">
                <strong>Total Payment:</strong>{' '}
                ₹{booking.pending_amount + booking.payment_received}
              </div>
              <div className="mb-2">
                <strong>Bank:</strong>{' '}{booking.bank}
              </div>
              <div className="mb-2">
                <strong>Other info:</strong>{' '}{booking.other_info}
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
              {booking.rooms
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
  );
}

