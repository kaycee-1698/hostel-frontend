'use client';

import React, { useEffect, useState } from 'react';
import { Booking, Room } from '@/types';
import Modal from '../Modal/Modal';
import BookingForm from './BookingForm';
import { useBookings } from '@/hooks/useBookings';
import BookingDetails from './BookingDetails';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSave: (savedBooking: Booking) => void;
  rooms: Room[];
}

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onSave,
  rooms,
}: BookingDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
  const { updateSingleBooking } = useBookings();

  useEffect(() => {
  if (booking) {
    setEditedBooking(booking);
    setIsEditing(false);
  }
  }, [booking]);
  
  if (!isOpen) return null;
  if (!booking || !editedBooking) return <Modal isOpen={true} onClose={onClose} title="Loading...">Loading booking...</Modal>;

  const handleSave = async (updatedBooking: Partial<Booking>) => {
    if (updatedBooking) {
      const requiresReassignment = checkIfReassignmentNeeded(booking, updatedBooking);
      const savedBooking: Booking = await updateSingleBooking(updatedBooking, requiresReassignment);
      
      onSave(savedBooking);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Discard changes?')) {
      setEditedBooking(booking);
      setIsEditing(false);
    }
  };

  const checkIfReassignmentNeeded = (originalBooking: Booking, updatedBooking: Partial<Booking>) => {

    const originalGuestsPerRoom: Record<number, number> =
    originalBooking.guests_per_room ??
    (originalBooking.rooms?.reduce((acc, room) => {
      acc[room.room_id] = room.beds?.length || 0;
      return acc;
    }, {} as Record<number, number>) || {});

    const updatedGuestsPerRoom = updatedBooking.guests_per_room ?? {};  

    const dateChanged =
      originalBooking.check_in !== updatedBooking.check_in ||
      originalBooking.check_out !== updatedBooking.check_out;

    const guestCountChanged =
      originalBooking.number_of_adults !== updatedBooking.number_of_adults;

    const roomsChanged =
      JSON.stringify(originalGuestsPerRoom) !== JSON.stringify(updatedGuestsPerRoom);

    return dateChanged || guestCountChanged || roomsChanged;
  }

  const guestsPerRoom: Record<number, number> = editedBooking.rooms?.reduce((acc, room) => {
    acc[room.room_id] = room.beds.length;
    return acc;
  }, {} as Record<number, number>) || {};

  const editedBookingWithGuests = {
    ...editedBooking,
    guests_per_room: guestsPerRoom,
  };


  return (
    <>
      {isEditing ? (
          <Modal isOpen={isOpen} onClose={onClose} title="Edit Booking">
            <BookingForm
              rooms={rooms}
              initialData={editedBookingWithGuests}
              onClose={handleCancel}
              onSave={handleSave}
            />
          </Modal>
      ) : (
        <Modal isOpen={isOpen} onClose={onClose} title={"Booking Details"}>
          <BookingDetails booking={booking} />
          <div className="flex justify-end mt-4 gap-2">
            <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Edit
            </button>
            <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ml-2"
            >
            Close
          </button>
        </div>
        </Modal>
      )}
    </>
  );
}

