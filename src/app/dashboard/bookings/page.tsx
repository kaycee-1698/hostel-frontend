import BookingsDashboard from '@/components/Bookings/BookingsDashboard';

export default function CheckInPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bookings Dashboard</h1>
      <BookingsDashboard />
    </div>
  );
}