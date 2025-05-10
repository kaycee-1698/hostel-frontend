
'use client';
import { useState, useMemo } from 'react';

import { useRooms } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';

import CalendarHeader from './CalendarHeader';
import DateRangeSelector from './DateRangeSelector';
import BedRow from './BedRow';
import AddBookingModal from '../Bookings/AddBookingModal';

import { addDays } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

import { Booking } from '@/types';

export default function RoomCalendar() {

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 15));
  const [expandedRooms, setExpandedRooms] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { rooms } = useRooms();
  const { calendarBookings, loading, error, fetchCalendarBookings } = useCalendarBookings(startDate, endDate);
  const { addNewBooking } = useBookings();

  const toggleRoom = (roomId: number) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const handleAddBooking = async (newBooking: Booking) => {
    await addNewBooking(newBooking);
    await fetchCalendarBookings(); // Refresh bookings after adding a new one
    setIsModalOpen(false);
  };

  const dates = Array.from({ length: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) }, (_, i) =>
    new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />      
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
          >
          + Add Booking
        </button>
      </div>


      {error && (
        <div className="mt-2 p-2 text-sm text-red-600 bg-red-100 border border-red-300 rounded">
          {error}
        </div>
      )}

      <div className="mt-4 border border-gray-200 rounded-md shadow-sm overflow-x-auto max-h-[75vh]">
        <div className="min-w-fit">
          {/* Header Row */}
          <div
            className="grid sticky top-0 bg-white z-20 border-b border-gray-200"
            style={{
              gridTemplateColumns: `200px repeat(${dates.length}, 100px)`
            }}
          >
            <div className="p-2 font-semibold border-r border-gray-200 sticky left-0 bg-white z-30 shadow-sm">
              Beds
            </div>
            <CalendarHeader dates={dates} />
          </div>

          {/* Bed Rows Grouped by Room */}
          {rooms.map((room) => {
            const isExpanded = expandedRooms[room.room_id] ?? true;

            return (
              <div key={room.room_id}>
                {/* Room Header */}
                <div className="grid" style={{ gridTemplateColumns: `200px repeat(${dates.length}, 100px)` }}>
                <div
                    className="flex items-center gap-2 bg-gray-100 sticky left-0 z-10 border-b border-gray-200 px-2 py-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => toggleRoom(room.room_id)}
                >
                    {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                    ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                    )}
                    {room.room_name}
                </div>
                {dates.map((_, i) => (
                    <div key={i} className="border-b border-gray-100 h-10" />
                ))}
                </div>

                {/* Beds */}
                {isExpanded &&
                  room.beds.map((bed) => (
                    <BedRow
                      key={bed.bed_id}
                      bedId={bed.bed_id}
                      bedName={bed.bed_name}
                      dates={dates}
                      bookingsByDate={calendarBookings?.[bed.bed_id] || {}}
                    />
                  ))
                  }
              </div>
            );
          })}
        </div>
      </div>
            <AddBookingModal
              isOpen={isModalOpen}
              rooms={rooms}
              onClose={() => setIsModalOpen(false)}
              onSave={handleAddBooking}
            />
    </div>
  );
}
