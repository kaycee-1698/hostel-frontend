import GuestTable from '@/components/Guests/GuestTable';

export default function GuestsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Guests</h1>
      <GuestTable />
    </div>
  );
}