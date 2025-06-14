import { useState } from 'react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomName: string) => void;
}

export default function AddRoomModal({ isOpen, onClose, onSave }: AddRoomModalProps) {
  const [roomName, setRoomName] = useState('');

  const handleSave = () => {
    if (roomName.trim()) {
      onSave(roomName.trim());
      setRoomName('');
      onClose();
    }
  };

  const handleClose = () => {
    setRoomName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Enter Room Name</h2>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="e.g. Dorm 1"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
    </div>
  );
}
