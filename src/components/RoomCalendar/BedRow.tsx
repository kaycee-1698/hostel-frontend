'use client';
import { useState } from 'react';
import { formatDate } from "@/lib/dateUtils";

type BedRowProps = {
  bedId: number;
  bedName: string;
  dates: Date[];
  bookingsByDate: Record<
    string,
    {
      booking_id: number;
      booking_name: string;
    }
  >;
  onBookingClick: (bookingID: number) => void;
};

export default function BedRow({
  bedId,
  bedName,
  dates,
  bookingsByDate,
  onBookingClick,
}: BedRowProps) {
  return (
    <div
      className="grid border-b border-gray-100 hover:bg-blue-50 transition-colors"
      style={{ gridTemplateColumns: `200px repeat(${dates.length}, 100px)` }}
    >
      <div className="bg-white sticky left-0 z-10 border-r border-gray-100 px-2 py-2 text-sm text-gray-700">
        {bedName}
      </div>
      {dates.map((date, i) => {
        const dateStr = formatDate(date);
        const booking = bookingsByDate?.[dateStr];

        return (
          <div
            key={i}
            className={`border border-gray-100 h-10 px-1 text-sm truncate flex items-center cursor-pointer ${
              booking ? 'bg-green-100 text-gray-900 font-medium' : ''
            }`}
            onDoubleClick={() => booking && onBookingClick(booking.booking_id)}
          >
            {booking ? (
              <div title={`Booking ID: ${booking.booking_id}`}>
                {booking.booking_name}
              </div>
            ) : (
              ''
            )}
          </div>
        );
      })}
    </div>
  );
}
