'use client';
import { useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import CalendarHeader from './CalendarHeader';
import DateRangeSelector from './DateRangeSelector';
import { addDays } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function RoomCalendar() {
  const { rooms } = useRooms();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 15));
  const [expandedRooms, setExpandedRooms] = useState<Record<number, boolean>>({});

  const toggleRoom = (roomId: number) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const dates: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return (
    <div className="p-4">
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />

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
                    <div
                      key={bed.bed_id}
                      className="grid border-b border-gray-100 hover:bg-blue-50 transition-colors"
                      style={{
                        gridTemplateColumns: `200px repeat(${dates.length}, 100px)`
                      }}
                    >
                      <div className="bg-white sticky left-0 z-10 border-r border-gray-100 px-2 py-2 text-sm text-gray-700">
                        {bed.bed_name}
                      </div>
                      {dates.map((_, i) => (
                        <div
                          key={i}
                          className="border border-gray-100 h-10"
                        />
                      ))}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
