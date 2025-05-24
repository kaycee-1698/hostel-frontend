'use client';
import { useState, useEffect, useRef } from 'react';
import { Booking, Room } from '@/types';
import { useBookings } from '@/hooks/useBookings';
import { formatISO, addDays, differenceInDays } from 'date-fns';

interface AddBookingModalProps {
  rooms: Room[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const OTA_OPTIONS = ['Direct', 'Website', 'Booking.com', 'Hostelworld', 'Makemytrip', 'Extension'];

export default function AddBookingModal({ rooms, isOpen, onClose, onSuccess }: AddBookingModalProps) {
  const initialDate = formatISO(new Date(), { representation: 'date' });
  const initialCheckout = formatISO(addDays(new Date(), 1), { representation: 'date' });

  const { addNewBooking} = useBookings();

  // States
  const [bookingName, setBookingName] = useState('');
  const [otaName, setOtaName] = useState('Direct');
  const [numAdults, setNumAdults] = useState(1);
  const [contactNumber, setContactNumber] = useState('');
  const [checkIn, setCheckIn] = useState(initialDate);
  const [checkOut, setCheckOut] = useState(initialCheckout);
  const [baseAmount, setBaseAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [otherInfo, setOtherInfo] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>(new Array(1).fill(''));
  const [errors, setErrors] = useState<string[]>([]);
  const bookingNameRef = useRef<HTMLInputElement>(null);

  // Reset form logic
  const resetForm = () => {
    setBookingName('');
    setOtaName('Direct');
    setNumAdults(1);
    setContactNumber('');
    setCheckIn(initialDate);
    setCheckOut(initialCheckout);
    setBaseAmount('');
    setPaidAmount(0);
    setOtherInfo('');
    setSelectedRooms(new Array(1).fill(''));
    setErrors([]);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => bookingNameRef.current?.focus(), 100); // slight delay for safety
    }
  }, [isOpen]);

  const getNights = (checkIn: string, checkOut: string) => {
    return differenceInDays(new Date(checkOut), new Date(checkIn));
  };

  const handleRoomChange = (index: number, roomId: string) => {
    const updated = [...selectedRooms];
    updated[index] = roomId;
    setSelectedRooms(updated);
  };

  const handleAdd = async () => {
    const newErrors: string[] = [];

    if (!bookingName.trim()) newErrors.push('Booking name is required.');
    if (!numAdults || numAdults < 1) newErrors.push('At least one adult must be added.');
    if (!checkIn) newErrors.push('Check-in date is required.');
    if (!checkOut) newErrors.push('Check-out date is required.');
    if (new Date(checkOut) <= new Date(checkIn)) newErrors.push('Check-out must be after check-in.');
    if (!baseAmount || parseFloat(baseAmount) <= 0) newErrors.push('Base amount must be greater than 0.');
    if (paidAmount == null || paidAmount < 0) newErrors.push('Paid amount can not be less than 0.');
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
      payment_received: paidAmount,
      other_info: otherInfo,
      guests_per_room: guestsPerRoom,
    };

    try {
      setErrors([]);
      await addNewBooking(newBooking);
      onSuccess?.();
    } catch (err: any) {
      setErrors([err.message || 'Something went wrong']);
      return;
    }

    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
    <div className="bg-white rounded-lg p-4 w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
      
      {/* Close Button */}
      <button
        onClick={() => {
          resetForm()
          onClose()
        }}
        className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-xl"
      >
        ×
      </button>

      <h2 className="text-lg font-semibold mb-2">Create New Booking</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Booking Name</label>
          <input
            ref={bookingNameRef}
            type="text"
            placeholder="Enter name"
            className={`w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.some(e => e.toLowerCase().includes('booking name')) ? 'border-red-500' : ''}`}
            value={bookingName}
            onChange={(e) => setBookingName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">OTA</label>
          <select
            value={otaName}
            onChange={(e) => setOtaName(e.target.value)}
            className="w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {OTA_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Number of Adults</label>
          <input
            type="number"
            min={1}
            className={`w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.some(e => e.toLowerCase().includes('one adult')) ? 'border-red-500' : ''}`}
            value={numAdults}
            onChange={(e) => {
              const value = Number(e.target.value)
              setNumAdults(value)
              setSelectedRooms(new Array(value).fill(''))
            }}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Contact Number (optional)</label>
          <input
            type="text"
            className="w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Check-In</label>
            <input
              type="date"
              className={`w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.some(e => e.toLowerCase().includes('check-in')) ? 'border-red-500' : ''}`}
              value={checkIn}
              onChange={(e) => {
                const selected = e.target.value
                setCheckIn(selected)
                if (new Date(checkOut) <= new Date(selected)) {
                  setCheckOut(formatISO(addDays(new Date(selected), 1), { representation: 'date' }))
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Check-Out</label>
            <input
              type="date"
              className={`w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.some(e => e.toLowerCase().includes('check-out')) ? 'border-red-500' : ''}`}
              value={checkOut}
              min={formatISO(addDays(new Date(checkIn), 1), { representation: 'date' })}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div className="flex items-end justify-center text-gray-700 text-sm font-medium">
            ({getNights(checkIn, checkOut)} night{getNights(checkIn, checkOut) !== 1 ? 's' : ''})
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Base Amount</label>
            <input
              type="number"
              step="0.01"
              className={`w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm h-[33px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.some(e => e.toLowerCase().includes('base amount')) ? 'border-red-500' : ''}`}
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Paid Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm h-[33px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Other Info (optional)</label>
            <textarea
              className="w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm h-[33px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter any notes"
              value={otherInfo}
              onChange={(e) => setOtherInfo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Room selectors */}
      <div className="mt-4">
        {selectedRooms.map((room, index) => (
          <div key={index} className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Room for Adult {index + 1}</label>
            <select
              value={room}
              onChange={(e) => handleRoomChange(index, e.target.value)}
              className={`w-full border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.some(e => e.toLowerCase().includes('assigned a room')) ? 'border-red-500' : ''}`}
            >
              <option value="">Select room</option>
              {rooms.map((roomObj) => (
                <option key={roomObj.room_id} value={roomObj.room_id}>
                  {roomObj.room_name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 text-red-600 text-sm space-y-1">
          {errors.map((err, i) => (
            <p key={i}>• {err}</p>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={resetForm}
          className="px-4 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Clear Form
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => {
              resetForm()
              onClose()
            }}
            className="px-4 py-1.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>

  );
}
