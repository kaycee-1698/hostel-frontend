import { useState, useRef } from 'react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavingChange?: (saving:boolean)=>void;
  onSave: (roomName: string, baseRate:number,roomType:'dormitory'|'private') => Promise<void>;
}

export default function AddRoomModal({ isOpen, onClose, onSave, onSavingChange }: AddRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [baseRate,setBaseRate]=useState('');
  const [roomType,setRoomType]=useState<'dormitory'|'private'>('dormitory');
  const [error,setError]=useState('');

  const [saving,setSaving]=useState(false);
  const inFlight=useRef(false);
  const handleSave = async () => {
    if(inFlight.current)return;
    setError('');
    if(!roomName.trim()){setError('Enter a room name.');return;}
    if (!/^\d+(\.\d{1,2})?$/.test(baseRate)||Number(baseRate)>1000000){setError('Enter a base rate between ₹0 and ₹10,00,000.');return;}
    if (roomName.trim()) {
      inFlight.current=true;setSaving(true);onSavingChange?.(true);
      try{await onSave(roomName.trim(),Number(baseRate),roomType);}catch(error){setError(error instanceof Error?error.message:'Could not create room.');return;}finally{inFlight.current=false;setSaving(false);onSavingChange?.(false);}
      setBaseRate('');
      setRoomName('');
      onClose();
    }
  };

  const handleClose = () => {
    if(inFlight.current)return;
    setRoomName('');setBaseRate('');setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Enter Room Name</h2>
        <input
          disabled={saving} type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="e.g. Dorm 1"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
        />
        <label className="mt-4 block text-sm">Room type<select disabled={saving} className="mt-2 w-full rounded border p-2" value={roomType} onChange={e=>setRoomType(e.target.value as 'dormitory'|'private')}><option value="dormitory">Dormitory</option><option value="private">Private room</option></select></label>
        <label className="mt-4 block text-sm">Base nightly rate (₹ per {roomType==='private'?'room':'bed'})<input disabled={saving} type="number" min="0" max="1000000" step="0.01" value={baseRate} onChange={e=>setBaseRate(e.target.value)} placeholder="e.g. 600" className="mt-2 w-full rounded border p-2"/></label>
        {error&&<p role="alert" className="mt-2 text-red-700">{error}</p>}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            disabled={saving} onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-black"
          >
            Cancel
          </button>
          <button
            disabled={saving} onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
    </div>
  );
}
