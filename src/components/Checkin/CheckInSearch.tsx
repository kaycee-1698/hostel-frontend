'use client';
import { getTodayBookings } from '@/lib/api';
import React, { useState, useEffect, use } from 'react';
import { Booking } from '@/types';

interface CheckInSearchProps {
  onSelectBooking: (booking: Booking) => void;
}

const CheckInSearch: React.FC<CheckInSearchProps> = ({ onSelectBooking }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000) // Add 5.5 hours for IST timezone
        .toISOString().split('T')[0]; // Format YYYY-MM-DD
        const response = await getTodayBookings(today);
        if (!Array.isArray(response.bookings)) {
            console.error('Invalid response format:', response.bookings);
            setResults([]);
            return;
          }
      
          setResults(response.bookings);
        } catch (error) {
          console.error('Error fetching bookings:', error);
          setResults([]);
        }
    };
    fetchBookings();
  }, []);

  const filtered = (results ?? []).filter((b) =>
    b.booking_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        className="border w-full p-2 rounded mb-2"
        type="text"
        placeholder="Search booking by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="bg-white shadow rounded">
        {filtered.map((booking) => (
          <li
            key={booking.booking_id}
            className="p-2 hover:bg-gray-100 cursor-pointer border-b"
            onClick={() => onSelectBooking(booking)}
          >
            {booking.booking_name} – {booking.number_of_adults} guests - {booking.number_of_nights} nights
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CheckInSearch;
