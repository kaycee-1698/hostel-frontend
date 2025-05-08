import { useRooms } from '@/hooks/useRooms';
import { Bed } from '@/types';

export default function BedTag({ 
  bed,
  removeBed 
}: { 
  bed: Bed,
  removeBed: (roomId: number, bedId: number) => Promise<any>;
}) {
  
  const handleRemoveBed = async (roomId: number, bedId: number) => {
    await removeBed(roomId, bedId); // Remove the bed from the room
  }

  return (
    <div className="bg-gray-100 border border-gray-300 text-sm px-3 py-1 rounded flex items-center flex-wrap gap-2 hover:shadow-md transition-transform hover:-translate-y-0.5">
      <span className="text-gray-700">{bed.bed_name}</span>
      <button
        onClick={() => handleRemoveBed(bed.room_id, bed.bed_id)}
        className="text-red-400 hover:text-red-600"
        title="Remove bed"
      >
        🗑
      </button>
    </div>
  );
}
