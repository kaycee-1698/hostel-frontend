import { Booking, CalendarBookings } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

//guest api functions

export async function createGuest(guest: any) {
  const res = await fetch(`${BASE_URL}/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guest),
  });
  return await res.json();
}

export async function getAllGuests() {
  const res = await fetch(`${BASE_URL}/guests`);
  return await res.json();
}

//booking api functions

export const createBooking = async (bookingData: Partial<Booking>) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create booking');
        }

        return data;
        
  } catch (error: any) {
    console.error('Error in createBooking:', error);
    throw error;
  }
};

export const getBookingById = async (id: number) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch booking');
  return res.json();
};

export async function getAllBookings() {
    const res = await fetch(`${BASE_URL}/bookings`);
    return res.json();
  };

export async function deleteBooking(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}`, {
      method: 'DELETE',
    });
  
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to delete booking ${id}:`, errorText);
      throw new Error('Failed to delete booking');
    }
  
    return res.json();
  }

export async function updateBooking(id: number, editedBooking: any, requiresReassignment: boolean) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      ...editedBooking,
      requiresReassignment,
    }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to update booking ${id}:`, errorText);
      throw new Error('Failed to update booking');
    }
  
    return res.json();
  }

  export async function getTodayBookings(today: string) { 
    const res = await fetch(`${BASE_URL}/bookings?check_in=${today}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch today's bookings:`, errorText);
      throw new Error('Failed to fetch today\'s bookings');
    }
    const data = await res.json();
    return data;
    
  }

  export async function getBookingsByBedAndDateRange (startDate: string, endDate: string): Promise<CalendarBookings>  {
    const res = await fetch(`${BASE_URL}/bookings/calendar?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch bookings by bed and date range:`, errorText);
      throw new Error('Failed to fetch bookings by bed and date range');
    }
    return res.json();
  }

  export const getBookingWithBedsAndRooms = async (id: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/details?booking_id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch bed and room details for booking');
    return res.json();
  };


  //file upload functions

  export async function uploadFile(file: File): Promise<string> {
    // Here, implement the upload logic (e.g., using Supabase Storage, Firebase, AWS S3)
    // For the sake of this example, let's assume it returns a URL after upload
    const storageURL = 'https://your-storage-service-url.com/uploaded-file-path';
    return storageURL;
  }

  //room api functions

  export async function getAllRooms() {
    const res = await fetch(`${BASE_URL}/rooms`);
    return res.json();
  }

  export async function getRoomById(id: number) {
    const res = await fetch(`${BASE_URL}/rooms/${id}`);
    return res.json();
  }

  export async function createRoom(room: any) {
    const res = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    });
    return res.json();
  }

  export async function updateRoom(id: number, room: any) {
    const res = await fetch(`${BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    });
    return res.json();
  }

  export async function deleteRoom(id: number) {
    const res = await fetch(`${BASE_URL}/rooms/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  export async function updateRoomCapacity(roomId: number) {
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/update-capacity`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  }

  //bed api functions

  export async function getAllBeds() {
    const res = await fetch(`${BASE_URL}/beds`);
    return res.json();
  }

  export async function getBedById(id: number) {
    const res = await fetch(`${BASE_URL}/beds/${id}`);
    return res.json();
  }

  export async function createBed(bed: any) {
    const res = await fetch(`${BASE_URL}/beds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bed),
    });
    return res.json();
  }

  export async function updateBed(id: number, bed: any) {
    const res = await fetch(`${BASE_URL}/beds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bed),
    });
    return res.json();
  }

  export async function deleteBed(id: number) {
    const res = await fetch(`${BASE_URL}/beds/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }


