import { useState } from 'react';
import { Booking } from '@/types';

export default function CreateBookingForm({ onCreate }: { onCreate: (b: Partial<Booking>) => void }) {
  const [newBooking, setNewBooking] = useState<Partial<Booking>>({
    booking_name: '',
    ota_name: '',
    number_of_adults: 1,
    contact_number: '',
    check_in: '',
    check_out: '',
    base_amount: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({
      ...prev,
      [name]: ['base_amount', 'number_of_adults'].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!newBooking.booking_name || !newBooking.ota_name || !newBooking.check_in || !newBooking.check_out) {
      alert('Please fill in all required fields');
      return;
    }
    onCreate(newBooking);
    setNewBooking({
      booking_name: '',
      ota_name: '',
      number_of_adults: 1,
      contact_number: '',
      check_in: '',
      check_out: '',
      base_amount: 0,
    });
  };

  return (
    <div className="p-4 bg-yellow-50 rounded shadow-md mb-6">
      {/* Fields (Guest Name, OTA, etc...) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {/* Reuse your existing JSX inputs here */}
        {/* Submit button */}
        <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
      </div>
    </div>
  );
}
