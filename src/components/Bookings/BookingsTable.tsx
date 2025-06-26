import React, { useState, useEffect } from 'react';
import { Booking, Room } from '@/types';
import BookingRow from './BookingRow';
import BookingDetailsModal from './BookingDetailsModal';
import { useBookings } from '@/hooks/useBookings';

interface BookingsTableProps {
  bookings: Booking[];
  onDelete: (id: number) => void;
}

export default function BookingsTable({ bookings, onDelete}: BookingsTableProps) {
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null); // Store selected booking
  const [isModalOpen, setIsModalOpen] = useState(false); // Control modal visibility
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSelectMode = selectedIds.length > 0;
  const allSelected = selectedIds.length === localBookings.length;
  
  const { getBedsAndRoomsForBooking } = useBookings();

  // Update localBookings whenever the bookings prop changes
  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  const handleSaveBooking = async (savedBooking: Booking) => {
    try {
      const updatedBookings = localBookings.map((booking) =>
        booking.booking_id === savedBooking.booking_id ? savedBooking : booking
      );
      setLocalBookings(updatedBookings);
  
      // ✅ Set the full, recalculated booking in the modal
      setSelectedBooking(savedBooking);
      
    } catch (error) {
      console.error('Save failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  const handleDeleteBooking = (id: number) => {
    // Delete the booking locally
    const updatedBookings = localBookings.filter((booking) => booking.booking_id !== id);
    setLocalBookings(updatedBookings);
    onDelete(id); // Call the onDelete function passed from the parent
    setSelectedBooking(null); // Close modal on delete
  };

  const handleBookingClick = async (bookingId: number) => {
    const booking = await getBedsAndRoomsForBooking(bookingId);
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(onDelete); // or send all IDs to backend if you optimize
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localBookings.map((b) => b.booking_id));
    }
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setIsModalOpen(false);
  };

  const exitSelectMode = () => setSelectedIds([]);

  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      setShowConfirm(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="overflow-x-auto">
        {/* Selection Bar */}
        <div className="w-full mb-2">
          <div className="w-full px-4 h-12 flex items-center justify-between border-b border-gray-200">
            {isSelectMode ? (
              <>
                <span className="text-sm text-gray-700">
                  {selectedIds.length} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={exitSelectMode}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div className="h-4" /> // empty space to keep height consistent
            )}
          </div>
        </div>


        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="px-4 py-3 text-left font-medium w-10">
                {isSelectMode ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  ) : (
                    "#"
                  )}
              </th>    
              {[
                  "Booking Name",
                  "OTA",
                  "Adults",
                  "Contact",
                  "Check-In",
                  "Check-Out",
                  "Nights",
                  "Pending ₹",
                  "Status",
                  "Bank",
                ].map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-medium">
                    {header}
                  </th>
                ))
              }
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {localBookings.map((booking, index) => (
                <BookingRow
                  key={booking.booking_id}
                  index={index}
                  booking={booking}
                  isHovered={hoveredRow === index}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.includes(booking.booking_id)}
                  onToggleSelect={() => toggleSelection(booking.booking_id)}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onRowClick={() => handleBookingClick(booking.booking_id)}
                />
              ))}    
          </tbody>
        </table>
      </div>
      {/* Render the modal outside the table, controlled by isModalOpen */}
      {isModalOpen && selectedBooking && (
        <BookingDetailsModal
          isOpen={!!selectedBooking}
          booking={selectedBooking}
          onSave={handleSaveBooking}
          onClose={closeModal} // Close the modal when needed
        />
      )}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md text-center">
            <p>Are you sure you want to delete {selectedIds.length} bookings?</p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
