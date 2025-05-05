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
    profit_after_commission: number;
    bank: string;
    other_info: string;
  }