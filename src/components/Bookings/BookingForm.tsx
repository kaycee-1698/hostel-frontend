'use client';

import { useState, useEffect, useRef } from 'react';
import { Booking } from '@/types';
import { formatISO, addDays, differenceInDays } from 'date-fns';
import { useRooms } from '@/hooks/useRooms';

const OTA_OPTIONS = ['Direct', 'Website', 'Booking.com', 'Hostelworld', 'Makemytrip', 'Extension'];

export default function BookingForm({ 
  initialData = {},
  onSave,
  onClose,
  onSuccess, }: { 
    initialData?: Partial<Booking>; // to prefill for edit mode
    onSave: (bookingData: Partial<Booking>) => Promise<void>;
    onClose: () => void;
    onSuccess?: () => void;
 }) {

  // Custom hook to fetch rooms and check availability
  const { rooms, IsRoomAvailable } = useRooms();

  // Default dates
  const todayISO = formatISO(new Date(), { representation: 'date' });
  const tomorrowISO = formatISO(addDays(new Date(), 1), { representation: 'date' });

  // States initialized from initialData or defaults
  const [bookingName, setBookingName] = useState(initialData.booking_name || '');
  const [otaName, setOtaName] = useState(initialData.ota_name || 'Direct');
  const [numAdults, setNumAdults] = useState(initialData.number_of_adults || 1);
  const [contactNumber, setContactNumber] = useState(initialData.contact_number || '');
  const [checkIn, setCheckIn] = useState(initialData.check_in || todayISO);
  const [checkOut, setCheckOut] = useState(initialData.check_out || tomorrowISO);
  const [baseAmount, setBaseAmount] = useState(initialData.base_amount != null ? initialData.base_amount.toString() : '');
  const [paidAmount, setPaidAmount] = useState(initialData.payment_received || 0);
  const [otherInfo, setOtherInfo] = useState(initialData.other_info || '');

  // Guests per room initial parsing
  const initSelectedRooms = (): string[] => {
    if (
      initialData?.guests_per_room &&
      typeof initialData.guests_per_room === 'object'
    ) {
      const arr: string[] = [];
      for (const [roomId, count] of Object.entries(initialData.guests_per_room)) {
        for (let i = 0; i < count; i++) {
          arr.push(roomId);
        }
      }
      if (arr.length !== initialData.number_of_adults) {
        return new Array(initialData.number_of_adults).fill('');
      }
      return arr;
    }
    return new Array(initialData?.number_of_adults || 1).fill('');
  };

  //Other states
  const [selectedRooms, setSelectedRooms] = useState<string[]>(initSelectedRooms());
  const [availableRoomMap, setAvailableRoomMap] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Ref for booking name input to focus on open
  const bookingNameRef = useRef<HTMLInputElement>(null);

  // Reset form logic
  const resetForm = () => {
    setBookingName('');
    setOtaName('Direct');
    setNumAdults(1);
    setContactNumber('');
    setCheckIn(todayISO);
    setCheckOut(tomorrowISO);
    setBaseAmount('');
    setPaidAmount(0);
    setOtherInfo('');
    setSelectedRooms(new Array(numAdults).fill(''));
    setErrors([]);
  };

  // Effect - Focus first input on open
  useEffect(() => {
    bookingNameRef.current?.focus();
  }, []);

  // Effect - If number of adults changes, sync selectedRooms length
  useEffect(() => {
    setSelectedRooms((prev) => {
      if (numAdults > prev.length) {
        return [...prev, ...new Array(numAdults - prev.length).fill('')];
      } else if (numAdults < prev.length) {
        return prev.slice(0, numAdults);
      }
      return prev;
    });
  }, [numAdults]);

// Effect - Check room availability whenever checkIn, checkOut or rooms change
  useEffect(() => {
    const fetchRoomAvailability = async () => {
      if (!checkIn || !checkOut || !rooms.length) return;
      const map: Record<string, number> = {};
      for (const room of rooms) {
        const count = await IsRoomAvailable(
          room.room_id,
          checkIn,
          checkOut,
          1, // Assuming 1 bed needed per adult
          initialData.booking_id ?? null // Exclude current booking when editing, or null otherwise
        );
        map[room.room_id] = count;
      }
      setAvailableRoomMap(map);
    };
    fetchRoomAvailability();
  }, [checkIn, checkOut, rooms, numAdults]);

  // Helper function to calculate nights between check-in and check-out dates
  const getNights = (checkIn: string, checkOut: string) => {
    return differenceInDays(new Date(checkOut), new Date(checkIn));
  };

  // Handle room change for each adult
  // This function updates the selectedRooms state when a room is assigned to an adult
  const handleRoomChange = (index: number, roomId: string) => {
  const updated = [...selectedRooms];
  updated[index] = roomId;
  setSelectedRooms(updated);
};

  // Helper function to get the number of guests assigned to a room
  const getRoomGuestCount = (roomId: string) =>
  selectedRooms.filter((r) => r === roomId).length;

  // Check if a room is over-assigned
  const isRoomOverAssigned = (roomId: string) => {
    const assignedCount = getRoomGuestCount(roomId);
    const availableCount = availableRoomMap[roomId] ?? 0;
    return assignedCount > availableCount;
  };

  // Validate and save booking
  // This function checks all fields and prepares the booking payload
  // If any validation fails, it sets the errors state
  // If successful, it calls the onSave prop with the booking data
  // If editing, it includes the booking_id in the payload
  // If successful, it resets the form and calls onSuccess callback
  // If any error occurs during save, it sets the errors state with the error message
  const handleSave = async () => {
    const newErrors: string[] = [];

    if (!bookingName.trim()) newErrors.push('Booking name is required.');
    if (!numAdults || numAdults < 1) newErrors.push('At least one adult must be added.');
    if (!checkIn) newErrors.push('Check-in date is required.');
    if (!checkOut) newErrors.push('Check-out date is required.');
    if (new Date(checkOut) <= new Date(checkIn)) newErrors.push('Check-out must be after check-in.');
    if (!baseAmount || isNaN(parseFloat(baseAmount)) || parseFloat(baseAmount) <= 0) newErrors.push('Base amount must be greater than 0.');
    if (paidAmount == null || paidAmount < 0) newErrors.push('Paid amount can not be less than 0.');
    const allRoomsAssigned = selectedRooms.every((id) => id && id.trim() !== '');
    if (!allRoomsAssigned) newErrors.push('All adults must be assigned a room.');
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const guestsPerRoom: Record<string, number> = {};
    selectedRooms.forEach((roomId) => {
      guestsPerRoom[roomId] = (guestsPerRoom[roomId] || 0) + 1;
    });

    const bookingPayload: Partial<Booking> = {
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
    
    // If editing, include booking_id 
    if (initialData.booking_id) {
      bookingPayload.booking_id = initialData.booking_id;
    }

    try {
      setErrors([]);
      await onSave(bookingPayload);
      onSuccess?.();
    } catch (err: any) {
      setErrors([err.message || 'Something went wrong']);
      return;
    }

    resetForm();
  };

  return (
    <div>
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
        <div className="mt-4">
          {selectedRooms.map((room, index) => {
            const isInvalid = room && !availableRoomMap[room];
            const isOverAssigned = room && isRoomOverAssigned(room);

            return (
              <div key={index} className="mb-2">
                <label className="block text-sm text-gray-600 mb-1">Room for Adult {index + 1}</label>
                <select
                  value={room}
                  onChange={(e) => handleRoomChange(index, e.target.value)}
                  className={`w-full border px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 
                    ${isInvalid || isOverAssigned ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
                  `}
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map((roomObj) => (
                    <option
                      key={roomObj.room_id}
                      value={roomObj.room_id}
                      disabled={availableRoomMap[roomObj.room_id] === 0}
                    >
                      {roomObj.room_name}
                      {availableRoomMap[roomObj.room_id] === 0 ? ' (Unavailable)' : ` (${availableRoomMap[roomObj.room_id]} beds available)`}
                    </option>
                  ))}
                </select>

                {isInvalid && (
                  <p className="text-red-500 text-xs mt-1">This room is not available for the selected dates.</p>
                )}
                {isOverAssigned && (
                  <p className="text-red-500 text-xs mt-1">Too many guests selected for this room.</p>
                )}
              </div>
            );
          })}
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
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
  );
}