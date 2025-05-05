'use client';
import { useEffect, useState } from 'react';
import { getAllGuests } from '@/lib/api';

export default function GuestTable() {
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    async function fetchGuests() {
      const data = await getAllGuests();
      setGuests(data.guests);
    }
    fetchGuests();
  }, []);

  return (
    <table className="w-full border mt-4">
      <thead>
        <tr>
          <th className="border px-4 py-2">Name</th>
          <th className="border px-4 py-2">Contact</th>
          <th className="border px-4 py-2">Email</th>
        </tr>
      </thead>
      <tbody>
        {guests.map((guest: any) => (
          <tr key={guest.guest_id}>
            <td className="border px-4 py-2">{guest.first_name}</td>
            <td className="border px-4 py-2">{guest.phone}</td>
            <td className="border px-4 py-2">{guest.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}