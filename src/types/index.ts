export interface Guest {
    first_name: string;
    last_name: string;
    birthday: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    gender: string;
    purpose_of_visit: string;
    how_heard_about_us: string;
    stayed_before: boolean;
    id_type: string;
    id_number: string;
    id_front: string, // Storing URL after upload
    id_back: string, // Storing URL after upload
    signature: string, // Storing URL after upload
    agree_tnc: boolean;
    agree_checkout: boolean;
    booking_id: number;
}

export interface Booking {
  booking_id: number;
  booking_name: string;
  ota_name: string;
  number_of_adults: number;
  contact_number: string;
  check_in: string;
  check_out: string;
  number_of_nights: number;
  base_amount: number;
  commission: number;
  gst: number;
  payment_received: number;
  pending_amount: number;
  payment_status: string;
  bank: string;
  other_info: string;
  guests_per_room?: Record<string, number>;
  rooms?: BookingRoom[];
}  

export interface Room {
  room_id: number;
  room_name: string;
  capacity: number;
  beds: Bed[]; // Array of beds associated with the room
}

export interface Bed {
  bed_id: number;
  status: string;
  bed_name: string;
  room_id: number;
}

export type CalendarBookings = {
  [bedId: number]: {
    [date: string]: {
      booking_id: number;
      booking_name: string;
    };
  };
};

export interface BookingRoom {
  booking_room_id: number;
  room_id: number;
  room_name: string;
  beds: BookingBed[];
}

export interface BookingBed {
  booking_bed_id: number;
  bed_id: number;
  bed_name: string;
  room_id: number;
  check_in: string;
  check_out: string;
}