import { useRef, useEffect, useState } from 'react';
import BedTag from './BedTag';
import { Room } from '@/types';

export default function RoomCard({ 
  room, 
  renameRoom, 
  removeRoom,
  addBed,
  removeBed,
  updateBed
}: { 
  room: Room; 
  renameRoom: (roomId: number, newName: string) => void;
  removeRoom: (roomId: number, roomName: string) => void;
  addBed: (roomId: number, bedName: string) => Promise<any>;
  removeBed: (roomId: number, bedId: number) => Promise<any>;
  updateBed: (bedId: number, bedName: string) => Promise<any>;
}) {

  const [editingName, setEditingName] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState(room.room_name);
  const [addingBed, setAddingBed] = useState(false);
  const [bedName, setBedName] = useState('');
  const [isAdding, setIsAdding] = useState(false);  
  const roomNameInputRef = useRef<HTMLInputElement>(null);
  const bedNameInputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (!roomNameInput.trim()) return;
    renameRoom(room.room_id, roomNameInput.trim());
    setEditingName(false);
  };

  const handleRemoveRoom = async (roomId: number, roomName: string) => {
    await removeRoom(roomId, roomName);
  };

  const handleAddBed = async () => {
  if (!bedName.trim()) return;
  setIsAdding(true);
  try {
    await addBed(room.room_id, bedName.trim());
    setBedName('');
    setAddingBed(false);
  } catch (error) {
    console.error('Error adding bed:', error);
    alert('Failed to add bed. Please try again.');
  } finally {
    setIsAdding(false);
  }
  };

  useEffect(() => {
    if (editingName && roomNameInputRef.current) {
      roomNameInputRef.current.focus();
    }
  }, [editingName]);

  useEffect(() => {
    if (addingBed && bedNameInputRef.current) {
      bedNameInputRef.current.focus();
    }
  }, [addingBed]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4 hover:shadow-md transition-transform hover:-translate-y-0.5">
      {/* Header: Room name + capacity */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
        {editingName ? (
          <>
            <input
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              ref={roomNameInputRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditingName(false);
              }}
            />
            <button
              onClick={handleRename}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setRoomNameInput(room.room_name); // Reset input to original
                setEditingName(false); // Exit edit mode
              }}
              className="text-gray-500 hover:text-gray-700 text-sm ml-2"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h2 className="text-md font-semibold text-gray-800">
              {room.room_name}
            </h2>
            <span className="text-sm text-gray-500">(Capacity: {room.capacity})</span>
            <button
              onClick={() => setEditingName(true)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Edit
            </button>
          </>
        )}

        </div>

        <button
          onClick={() => handleRemoveRoom(room.room_id, room.room_name)}
          className="text-sm text-red-500 hover:text-red-700"
        >
          🗑 Delete Room
        </button>
      </div>

      {/* Beds section */}
      <div className="flex flex-wrap gap-2 items-center">
        {room.beds.map((bed) => (
          <BedTag 
          key={bed.bed_id} 
          bed={bed}
          removeBed={removeBed}
          updateBed={updateBed} 
          />
        ))}

        {/* Add bed button/input */}
        {addingBed ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Bed name"
            value={bedName}
            onChange={(e) => setBedName(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            ref={bedNameInputRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddBed();
              if (e.key === 'Escape') {
                setAddingBed(false);
                setBedName('');
              }
            }}
          />
          <button
            onClick={handleAddBed}
            disabled={isAdding || !bedName.trim()}
            className="text-green-600 hover:text-green-800 text-sm disabled:opacity-50"
          >
            {isAdding ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setAddingBed(false);
              setBedName('');
            }}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingBed(true)}
          className="text-sm text-gray-600 hover:text-blue-600 underline"
        >
          + Add Bed
        </button>
      )}
      </div>
    </div>
  );
}
