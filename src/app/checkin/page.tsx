'use client';
import React, { useState } from 'react';
import CheckInSearch from '@/components/Checkin/CheckInSearch';
import CheckInForm from '@/components/Checkin/CheckInForm';
import { Booking } from '@/types';

export default function CheckInPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Guest Check-In</h1>
      {!selectedBooking ? (
        <CheckInSearch onSelectBooking={setSelectedBooking} />
      ) : (
        <CheckInForm booking={selectedBooking} />
      )}      
    </div>
  );
}