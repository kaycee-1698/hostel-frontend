import { useRef, useEffect, useState } from 'react';
import { Bed } from '@/types';

export default function BedTag({ 
  bed,
  removeBed,
  updateBed
}: { 
  bed: Bed,
  removeBed: (roomId: number, bedId: number) => Promise<any>;
  updateBed: (bedId: number, bedName: string) => Promise<any>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bed.bed_name);
  const inputRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    await updateBed(bed.bed_id, name.trim());
    setEditing(false);
  };

  const handleCancelEdit = (originalName: string) => {
    setName(originalName);
    setEditing(false);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  return editing ? (
    <div className="flex items-center gap-2">
    <input
      type="text"
      ref={inputRef}
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') {
          handleCancelEdit(bed.bed_name);
        }
      }}
      className="border rounded px-2 py-1 text-sm"
    />
    <button
      onClick={save}
      className="text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
    >
      Save
    </button>
    <button
      onClick={() => {
        handleCancelEdit(bed.bed_name);
      }}
      className="text-gray-400 hover:text-gray-600 text-sm"
    >
      Cancel
    </button>

    </div>
  ) : (
    <div className="bg-gray-100 border border-gray-300 text-sm px-3 py-1 rounded flex items-center flex-wrap gap-2 hover:shadow-md transition-transform hover:-translate-y-0.5">
    <span
      onClick={() => setEditing(true)}
      className="text-gray-700"
      title="Edit bed name"
    >
      {bed.bed_name}
    </span>
    <button
    onClick={() => removeBed(bed.room_id, bed.bed_id)}
    className="text-red-400 hover:text-red-600 cursor-pointer"
    title="Delete bed"
  >
    🗑
  </button>
  </div>
  );
}
