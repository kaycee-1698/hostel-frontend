'use client';
import { Booking } from '@/types';
import Modal from '../Modal/Modal';
import BookingForm from './BookingForm';
import { useBookings } from '@/hooks/useBookings';

export default function AddBookingModal({ 
  isOpen, 
  onClose, 
  onSuccess }: { 
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
 }) {
  const { addNewBooking} = useBookings();

  const handleSave = async (newBooking: Partial<Booking>) => {
    try {
      await addNewBooking(newBooking);
      onSuccess?.();
    } catch (err: any) {
      throw new Error(err.message || 'Something went wrong');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Booking">
      <BookingForm 
      onClose={onClose} onSave={handleSave} onSuccess={onSuccess} />
    </Modal>
  );
}

