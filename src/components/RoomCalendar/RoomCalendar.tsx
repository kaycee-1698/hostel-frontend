'use client';
import { useState, useEffect, useMemo } from 'react';

import { useRooms } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';

import CalendarHeader from './CalendarHeader';
import DateRangeSelector from './DateRangeSelector';
import BedRow from './BedRow';
import AddBookingModal from '../Bookings/AddBookingModal';
import BookingDetailsModal from '../Bookings/BookingDetailsModal';

import { addDays, toIST } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Booking } from '@/types';

export default function RoomCalendar() {
  const [startDate, setStartDate] = useState<Date>(toIST(new Date()));
  const [endDate, setEndDate] = useState<Date>(addDays(toIST(new Date()), 15));
  const [expandedRooms, setExpandedRooms] = useState<Record<number, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { rooms } = useRooms();
  const { addNewBooking, updateSingleBooking, getSingleBooking } = useBookings();
  const { calendarBookings, loading, error, fetchCalendarBookings } = useCalendarBookings(startDate, endDate);

  const dates = useMemo(() => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Array.from({ length: days }, (_, i) => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i));
  }, [startDate, endDate]);

  const toggleRoom = (roomId: number) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const handleAddBooking = async (newBooking: Booking) => {
    await addNewBooking(newBooking);
    await fetchCalendarBookings();
    setIsAddModalOpen(false);
  };

  const handleSaveBooking = async (updatedBooking: Booking) => {
    const saved = await updateSingleBooking(updatedBooking.booking_id, updatedBooking);
    await fetchCalendarBookings();
    setSelectedBooking(saved);
    return saved;
  };

  const handleBookingClick = async (bookingId: number) => {
    const booking = await getSingleBooking(bookingId);
    setSelectedBooking(booking);
    setIsBookingModalOpen(true);
  };

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
          onClick={() => setIsAddModalOpen(true)}
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
          <div
            className="grid sticky top-0 bg-white z-20 border-b border-gray-200"
            style={{ gridTemplateColumns: `200px repeat(${dates.length}, 100px)` }}
          >
            <div className="p-2 font-semibold border-r border-gray-200 sticky left-0 bg-white z-30 shadow-sm">
              Beds
            </div>
            <CalendarHeader dates={dates} />
          </div>

          {rooms.map((room) => {
            const isExpanded = expandedRooms[room.room_id] ?? true;
            return (
              <div key={room.room_id}>
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

                {isExpanded &&
                  room.beds.map((bed) => (
                    <BedRow
                      key={bed.bed_id}
                      bedId={bed.bed_id}
                      bedName={bed.bed_name}
                      dates={dates}
                      bookingsByDate={calendarBookings?.[bed.bed_id] || {}}
                      onBookingClick={handleBookingClick}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      <AddBookingModal
        isOpen={isAddModalOpen}
        rooms={rooms}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddBooking}
      />

      {isBookingModalOpen && selectedBooking && (
        <BookingDetailsModal
          isOpen={isBookingModalOpen}
          booking={selectedBooking}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedBooking(null);
          }}
          onSave={handleSaveBooking}
        />
      )}
    </div>
  );
}
