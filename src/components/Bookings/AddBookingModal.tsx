'use client';
import { useRef, useEffect } from 'react';
import { Booking } from '@/types';
import Modal from '../Modal/Modal';
import BookingForm from './BookingForm';
import { useBookings } from '@/hooks/useBookings';

export default function AddBookingModal({
  isOpen,
  initialData,
  onClose,
  onSuccess }: {
    isOpen: boolean;
    initialData?: Partial<Booking>;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
 }) {
  const saving = useRef(false);
  const requestId = useRef<string | null>(null);
  useEffect(() => { if (!isOpen) requestId.current = null; }, [isOpen]);
  const close = () => { if (!saving.current) onClose(); };
  const { addNewBooking} = useBookings();

  const handleSave = async (newBooking: Partial<Booking>) => {
    saving.current = true;
    try {
      requestId.current ??= crypto.randomUUID();
      await addNewBooking({...newBooking, create_request_id: requestId.current});
    } catch (err: any) {
      throw new Error(err.message || 'Something went wrong');
    } finally {
      saving.current = false;
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Create Booking">
      <BookingForm initialData={initialData}
      onClose={close} onSave={handleSave} onSuccess={onSuccess} />
    </Modal>
  );
}

