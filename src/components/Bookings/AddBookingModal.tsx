'use client';
import { useState } from 'react';
import { Booking } from '@/types';
import { Room } from '@/types';
import { formatISO, addDays } from 'date-fns';

interface AddBookingModalProps {
  rooms: Room[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBooking: Booking) => void;
}

const OTA_OPTIONS = ['Direct', 'Website', 'Booking.com', 'Hostelworld', 'Makemytrip', 'Extension'];

export default function AddBookingModal({ rooms, isOpen, onClose, onSave }: AddBookingModalProps) {
  const [bookingName, setBookingName] = useState('');
  const [otaName, setOtaName] = useState('Direct');
  const [numAdults, setNumAdults] = useState(1);
  const [contactNumber, setContactNumber] = useState('');
  const [checkIn, setCheckIn] = useState(formatISO(new Date(), { representation: 'date' }));
  const [checkOut, setCheckOut] = useState(formatISO(addDays(new Date(), 1), { representation: 'date' }));
  const [baseAmount, setBaseAmount] = useState('');
  const [otherInfo, setOtherInfo] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>(new Array(numAdults).fill(''));
  const [errors, setErrors] = useState<string[]>([]);

  const handleRoomChange = (index: number, roomId: string) => {
    const updated = [...selectedRooms];
    updated[index] = roomId;
    setSelectedRooms(updated);
  };

  const handleSave = () => {
    const newErrors: string[] = [];

    if (!bookingName.trim()) newErrors.push('Booking name is required.');
    if (!numAdults || numAdults < 1) newErrors.push('At least one adult must be added.');
    if (!checkIn) newErrors.push('Check-in date is required.');
    if (!checkOut) newErrors.push('Check-out date is required.');
    if (new Date(checkOut) <= new Date(checkIn)) newErrors.push('Check-out must be after check-in.');
    if (!baseAmount || parseFloat(baseAmount) <= 0) newErrors.push('Base amount must be greater than 0.');

    // Optional: validate selected rooms match number of adults
    if (selectedRooms.some((roomId) => !roomId)) newErrors.push('All adults must be assigned a room.');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const guestsPerRoom: Record<string, number> = {};
    selectedRooms.forEach((roomId) => {
      guestsPerRoom[roomId] = (guestsPerRoom[roomId] || 0) + 1;
    });

    const newBooking: Partial<Booking> = {
      booking_name: bookingName,
      ota_name: otaName,
      number_of_adults: numAdults,
      contact_number: contactNumber,
      check_in: checkIn,
      check_out: checkOut,
      base_amount: parseFloat(baseAmount),
      other_info: otherInfo,
      guests_per_room: guestsPerRoom,
    };

    setErrors([]);
    onSave(newBooking as Booking);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-xl">
          ×
        </button>

        <h2 className="text-lg font-semibold mb-4">Create New Booking</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Booking name"
            className={`border px-3 py-2 rounded ${errors.some(e => e.toLowerCase().includes('booking name')) ? 'border-red-500' : ''}`}
            value={bookingName}
            onChange={(e) => setBookingName(e.target.value)}
          />

          <select
            value={otaName}
            onChange={(e) => setOtaName(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            {OTA_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            placeholder="Number of Adults"
            className={`border px-3 py-2 rounded ${errors.some(e => e.toLowerCase().includes('one adult')) ? 'border-red-500' : ''}`}
            value={numAdults}
            onChange={(e) => {
              setNumAdults(Number(e.target.value));
              setSelectedRooms(new Array(Number(e.target.value)).fill(''));
            }}
          />

          <input
            type="text"
            placeholder="Contact Number (optional)"
            className="border px-3 py-2 rounded"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />

          <input
            type="date"
            className={`border px-3 py-2 rounded ${errors.some(e => e.toLowerCase().includes('check-in')) ? 'border-red-500' : ''}`}
            value={checkIn}
            onChange={(e) => {
              const selected = e.target.value;
              setCheckIn(selected);
              const nextDay = formatISO(addDays(new Date(selected), 1), { representation: 'date' });
              if (new Date(checkOut) <= new Date(selected)) {
                setCheckOut(nextDay);
              }
            }}
          />

          <input
            type="date"
            className={`border px-3 py-2 rounded ${errors.some(e => e.toLowerCase().includes('check-out')) ? 'border-red-500' : ''}`}
            value={checkOut}
            min={formatISO(addDays(new Date(checkIn), 1), { representation: 'date' })}
            onChange={(e) => setCheckOut(e.target.value)}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Base amount"
            className={`border px-3 py-2 rounded h-[40px] ${errors.some(e => e.toLowerCase().includes('base amount')) ? 'border-red-500' : ''}`}
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
          />

          <textarea
            placeholder="Other info (optional)"
            className="border px-3 py-2 rounded resize-none h-[40px]"
            value={otherInfo}
            onChange={(e) => setOtherInfo(e.target.value)}
          />
        </div>

        {/* Room selector (1 per adult) */}
        <div className="mt-4">
          {selectedRooms.map((room, index) => (
            <select
              key={index}
              value={room}
              onChange={(e) => handleRoomChange(index, e.target.value)}
              className={`border px-3 py-2 rounded mb-2 w-full ${errors.some(e => e.toLowerCase().includes('assigned a room')) ? 'border-red-500' : ''}`}
            >
              <option value="">Select room for adult {index + 1}</option>
              {rooms.map((roomObj) => (
              <option key={roomObj.room_id} value={roomObj.room_id}>
                {roomObj.room_name}
              </option>
                ))}
            </select>
          ))}
        </div>

        {errors.length > 0 && (
          <div className="mt-4 text-red-600 text-sm space-y-1">
            {errors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}
        
        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
