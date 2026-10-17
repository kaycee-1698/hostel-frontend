import { Booking, CalendarBookings } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

//guest api functions

export async function createGuest(guest: any) {
  const res = await fetch(`${BASE_URL}/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guest),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || 'Guest check-in failed. Please try again.');
  if (!data?.guest?.guest_id) throw new Error('The server did not confirm that the guest was saved.');
  return data;
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
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Failed to delete booking. Please try again.');
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

  export async function getBookingsByBedAndDateRange (startDate: string, endDate: string): Promise<import("@/types").CalendarData>  {
    const res = await fetch(`${BASE_URL}/bookings/calendar?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch bookings by bed and date range:`, errorText);
      throw new Error('Failed to fetch bookings by bed and date range');
    }
    const data = await res.json();
    if (!data.calendarBookings) {
      throw new Error('Calendar data is outdated. Restart the updated backend.');
    }
    return data;
  }

  export const getBookingWithBedsAndRooms = async (id: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/details?booking_id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch bed and room details for booking');
    return res.json();
  };


  //file upload functions

  // Files are read locally; the check-in request uploads them on submission.
  export async function readGuestImage(file: File): Promise<string> {
    if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choose a JPEG or PNG image.');
    if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Each image must be between 1 byte and 5 MB.');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result) : reject(new Error('Could not read the image.'));
      reader.onerror = () => reject(new Error('Could not read the image.'));
      reader.onabort = () => reject(new Error('Image reading was cancelled.'));
      reader.readAsDataURL(file);
    });
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
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Could not create room. Please try again.');
    return data;
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

  export async function getRoomAvailability(roomId: number, checkIn: string, checkOut: string, bedsRequired: number, excludeBookingId: number | null) {
    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      beds_required: bedsRequired.toString(),
    });

    if (excludeBookingId) {
      params.append('exclude_booking_id', excludeBookingId.toString());
    }

    const res = await fetch(`${BASE_URL}/rooms/${roomId}/availability?${params.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to check room availability');
    }
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



export async function moveCalendarAssignment(id: number, move: {
  bed_id: number; check_in: string; expected_bed_id: number;
  expected_check_in: string; expected_check_out: string;
  swap_assignment_id?: number; swap_check_in?: string; swap_check_out?: string; confirm_swap?: boolean;
}) {
  const response = await fetch(`${BASE_URL}/booking-beds/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(move),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Could not move the assignment. Refresh and try again.');
  return body;
}

export async function getRoomRates(start:string,end:string){
 const res=await fetch(`${BASE_URL}/room-rates?${new URLSearchParams({start,end})}`,{cache:'no-store'});
 if(!res.ok)throw new Error('Could not load rates');return res.json();
}
export async function saveRoomRates(updates:{room_id:number;date:string;rate:number|null}[]){
 const res=await fetch(`${BASE_URL}/room-rates`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({updates})});
 const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not save rates.');return data;
}

export async function getBookingQuote(check_in:string,check_out:string,guests_per_room:Record<string,number>){
 const res=await fetch(`${BASE_URL}/room-rates/quote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({check_in,check_out,guests_per_room})});
 const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not calculate price.');return data as {base_amount:number};
}
