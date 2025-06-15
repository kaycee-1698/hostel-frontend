'use client';
import { Booking } from '@/types';
import Modal from '../Modal/Modal';
import BookingForm from './BookingForm';
import { useRooms } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';

export default function AddBookingModal({ 
  isOpen, 
  onClose, 
  onSuccess }: { 
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
 }) {
  const { rooms } = useRooms();
  const { addNewBooking} = useBookings();

  const handleSave = async (newBooking: Partial<Booking>) => {
    try {
      await addNewBooking(newBooking);
      onSuccess?.();
    } catch (err: any) {
      console.error([err.message || 'Something went wrong']);
      return;
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Booking">
      <BookingForm 
      rooms={rooms} onClose={onClose} onSave={handleSave} onSuccess={onSuccess} />
    </Modal>
  );
}

