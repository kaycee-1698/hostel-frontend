import { useEffect, useState } from 'react';
import { getAllBookings, deleteBooking, updateBooking, createBooking, getBookingById, getBookingWithBedsAndRooms } from '@/lib/api';
import { Booking } from '@/types';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    const data = await getAllBookings();
    const sorted = data.bookings.sort((a: Booking, b:Booking) => {
      const dateA = new Date(a.check_in);
      const dateB = new Date(b.check_in);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      const otaA = a.ota_name.toLowerCase();
      const otaB = b.ota_name.toLowerCase();
      if (otaA < otaB) return -1;
      if (otaA > otaB) return 1;
      return a.booking_name.toLowerCase().localeCompare(b.booking_name.toLowerCase());
    });
    setBookings(sorted);
  };



  const removeBooking = async (id: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    setLoadingId(String(id));
    await deleteBooking(id);
    await fetchBookings();
    setLoadingId(null);
  };

  const updateSingleBooking = async (updated: Partial<Booking>, requiresReassignment: boolean) => {
    try {
      const id = Number(updated.booking_id);
      await updateBooking(id, updated, requiresReassignment);
      const savedBooking = await getBookingWithBedsAndRooms(id);
      setBookings(prev => prev.map(b => (b.booking_id === id ? savedBooking : b)));
      return savedBooking; // Return the updated booking for further processing if needed
    } catch (error) {
      console.error('Booking update error:', error);
      throw error; // rethrow for component to catch
    }
  };

  const addNewBooking = async (booking: Partial<Booking>) => {
    try {
      await createBooking(booking);
    } catch (error) {
      console.error('Booking creation error:', error);
      throw error; // rethrow for component to catch
    }
  };


  const getSingleBooking = async (id: number) => {
    const selectedBooking = await getBookingById(id);
    return selectedBooking;
  };

  const getBedsAndRoomsForBooking = async (id: number) => {
    const selectedBooking = await getBookingWithBedsAndRooms(id);
    return selectedBooking;
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loadingId,
    fetchBookings,
    removeBooking,
    updateSingleBooking,
    addNewBooking,
    getSingleBooking,
    getBedsAndRoomsForBooking
  };
}
