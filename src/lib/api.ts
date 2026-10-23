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
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||data.message||'Could not save room details.');
    return data;
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

export async function getDashboard(){
 const res=await fetch(`${BASE_URL}/dashboard`,{cache:'no-store'});
 if(!res.ok)throw new Error('Could not load dashboard');
 return res.json();
}

export type BookingSearchResult=Pick<Booking,'booking_id'|'booking_name'|'contact_number'|'check_in'|'check_out'|'number_of_adults'|'pending_amount'>;
export async function searchBookings(query:string,signal?:AbortSignal):Promise<BookingSearchResult[]>{
 const res=await fetch(`${BASE_URL}/bookings/search?${new URLSearchParams({q:query})}`,{signal,cache:'no-store'});
 if(!res.ok)throw new Error('Could not search bookings. Please try again.');
 return res.json();
}

export type ActivityLog={log_id:number;occurred_at:string;actor_name:string;actor_role:string;action:string;entity_type:string;entity_id:string;summary:string;changed_fields:string[];before_values:Record<string,unknown>|null;after_values:Record<string,unknown>|null};
export type ActivityLogResponse={logs:ActivityLog[];total:number;page:number;pageSize:number};
export async function getActivityLogs(filters:Record<string,string>,signal?:AbortSignal):Promise<ActivityLogResponse>{
 const res=await fetch(`${BASE_URL}/activity-logs?${new URLSearchParams(filters)}`,{signal,cache:'no-store'});
 const data=await res.json();
 if(!res.ok)throw new Error(data.error||'Could not load activity logs. Please try again.');
 return data;
}

export async function collectBookingPayment(id:number,amount:number,request_id:string):Promise<Booking>{
 const res=await fetch(`${BASE_URL}/bookings/${id}/collect-payment`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,request_id})});
 const data=await res.json().catch(()=>null);
 if(!res.ok){const error=new Error(data?.error||'Could not confirm the payment. Please retry.') as Error&{definitive?:boolean};error.definitive=res.status===400||res.status===409;throw error;}
 if(!data?.booking_id)throw new Error('Could not confirm the payment. Please retry.');
 return data;
}

export type ExtraItem={item_id:number;name:string;category:string;price:number|null;active:boolean};
export type ExtraSale={sale_id:string;item_id:number;item_name:string;category:string;quantity:number;unit_price:number;total:number;paid_on:string;payment_method:string;booking_id:number|null;booking_name:string|null;notes:string;status:'Recorded'|'Voided';void_reason:string|null;paid_amount:number;customer_name:string;lines:ExtraLine[]};
export type ExtraLine={item_id:number;name?:string;quantity:number;unit_price:number;total?:number};
export type ExtraSaleInput={request_id:string;lines:ExtraLine[];paid:boolean;customer_name:string;paid_on:string;method:string;booking_id:number|null;notes:string};
async function extrasRequest(path:string,options?:RequestInit){
 const res=await fetch(`${BASE_URL}/extras/${path}`,{cache:'no-store',...options});
 const body=await res.json().catch(()=>null);
 if(!res.ok){const error=new Error(body?.error||'Could not complete the request. Please retry.') as Error&{definitive?:boolean};error.definitive=res.status===400||res.status===409;throw error;}
 return body;
}
export const getExtraItems=():Promise<ExtraItem[]>=>extrasRequest('items');
export const saveExtraItem=(item:Omit<ExtraItem,'item_id'>,id?:number):Promise<ExtraItem>=>extrasRequest(id?`items/${id}`:'items',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});
export const getExtraSales=(filters:Record<string,string>,signal?:AbortSignal):Promise<{sales:ExtraSale[];count:number;total:number;pending:number;page:number;pageSize:number}>=>extrasRequest(`sales?${new URLSearchParams(filters)}`,{signal});
export const recordExtraSale=(input:ExtraSaleInput):Promise<ExtraSale>=>extrasRequest('sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
export const voidExtraSale=(id:string,reason:string):Promise<ExtraSale>=>extrasRequest(`sales/${id}/void`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});

export const collectExtraPayment=(id:string,input:{request_id:string;amount:number;method:string}):Promise<ExtraSale>=>extrasRequest(`sales/${id}/collect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});

export type InvoiceLine={kind?:'accommodation'|'extra';description:string;sac:string;quantity:number;unit_price:number;discount:number;tax_rate:number;tax_basis:'inclusive'|'exclusive'};
export type InvoiceDraft={stay_beds?:({bed_id:number;room_name:string;bed_name:string}|null)[];phone_country?:string;phone_national?:string;payment_mode?:string;customer_name:string;customer_phone:string;customer_email:string;customer_address:string;customer_gstin:string;place_of_supply:string;issue_date:string;due_date:string;check_in:string;check_out:string;guests:string;stay_details:string;notes:string;tax_mode:'split'|'igst';lines:InvoiceLine[];amount_paid:number;source_balance?:number};
export type IssuedInvoice={invoice_id:string;invoice_number:string;booking_id:number|null;created_at:string;snapshot:InvoiceDraft&{total:number;balance_due:number;tax:number;subtotal:number}};
async function invoiceRequest(path:string,options?:RequestInit){const res=await fetch(`${BASE_URL}/invoices${path}`,{cache:'no-store',...options});if(!res.ok){const body=await res.json().catch(()=>null);throw Object.assign(new Error(body?.error||'Could not complete the invoice request.'),{definitive:res.status===400||res.status===409});}return res;}
export const getInvoices=async(page=1):Promise<{invoices:IssuedInvoice[];count:number;page:number}>=>(await invoiceRequest(`?page=${page}`)).json();
export const getBookingInvoice=async(id:number):Promise<{draft?:InvoiceDraft;existing?:IssuedInvoice}>=>(await invoiceRequest(`/booking/${id}`)).json();
export const issueInvoice=async(input:{request_id:string;booking_id:number|null;draft:InvoiceDraft}):Promise<IssuedInvoice>=>(await invoiceRequest('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})).json();
export async function downloadInvoice(id:string,filename:string){const blob=await(await invoiceRequest(`/${id}/download`)).blob();saveInvoiceBlob(blob,filename);}
export async function previewInvoice(draft:InvoiceDraft){const blob=await(await invoiceRequest('/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)})).blob();saveInvoiceBlob(blob,'Invoice-preview.pdf');}
function saveInvoiceBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}

export async function uploadRoomPhoto(id:number,photo:string){
 const res=await fetch(`${BASE_URL}/rooms/${id}/photos`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo})});
 const data=await res.json();if(!res.ok)throw new Error(data.error||data.message||'Could not upload photo.');return data;
}
export async function saveRoomPhotos(id:number,expected:string[],paths:string[]){
 const res=await fetch(`${BASE_URL}/rooms/${id}/photos`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected,paths})});
 const data=await res.json();if(!res.ok)throw new Error(data.error||data.message||'Could not save photos.');return data;
}
