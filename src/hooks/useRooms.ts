import { useEffect, useState } from 'react';
import { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom, updateRoomCapacity, getAllBeds, getBedById, createBed, updateBed, deleteBed, getRoomAvailability} from '@/lib/api';
import { Room, Bed } from '@/types';

export function useRooms() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [beds, setBeds] = useState<Bed[]>([]);

    const fetchRooms = async () => {
        setLoading(true); setError(null);
        try {
          const data = await getAllRooms();
          if (!Array.isArray(data.rooms)) throw new Error('Invalid rooms response');
          setRooms(data.rooms);
        } catch { setError('Could not load rooms. Please try again.'); }
        finally { setLoading(false); }
      };

    const addRoom = async (room: Partial<Room>) => {
        await createRoom(room);
        await fetchRooms();
      };

    const removeRoom = async (id: number) => {
        if (!confirm('Are you sure you want to delete this room and all the beds in this room?')) return;
        await deleteRoom(id);
        await fetchRooms();
        };

    const updateSingleRoom = async (id: number, room_name: string) => {
        const updated = {
            room_name: room_name
        };
        await updateRoom(id, updated);
        const updatedRoom = await getRoomById(id);
        setRooms(prev =>
            prev.map(room =>
              room.room_id === updatedRoom.room_id
                ? { ...room, ...updatedRoom }
                : room
            )
          );
        return updatedRoom; // Return the updated room for further processing if needed
        };

    const addBedToRoom = async (roomId: number, bedName: string) => {
        const newBed = {
            room_id: roomId,
            bed_name: bedName,
            status: 'available',
        };        
        await createBed(newBed); // Creates the bed
        await updateRoomCapacity(roomId); // Update backend capacity
        const updatedRoom = await getRoomById(roomId); //includes beds
        setRooms(prev =>
            prev.map(r => (r.room_id === roomId ? updatedRoom : r))
        );
        return updatedRoom;
        };

    const removeBedFromRoom = async (roomId: number, bedId: number) => {
        if (!confirm('Are you sure you want to delete this bed?')) return;
        await deleteBed(bedId);
        await updateRoomCapacity(roomId);
        const updatedRoom = await getRoomById(roomId);
        setRooms(prev => prev.map(r => (r.room_id === roomId ? updatedRoom : r)));
        return updatedRoom; // Return the updated room for further processing if needed
        };  

    const updateBedName = async (bedId: number, bedName: string) => {
        const updatedBed = {
            bed_name: bedName
        }; 
        await updateBed(bedId, updatedBed);
        const updatedBedData = await getBedById(bedId);
        const roomId = updatedBedData.room_id;

        // Fetch the updated room with its beds
        const updatedRoom = await getRoomById(roomId);
        setRooms(prev => prev.map(r => r.room_id === roomId ? updatedRoom : r));
    
        return updatedBedData; // Return the updated bed for further processing if needed
        }

    const IsRoomAvailable = async (roomId: number, checkIn: string, checkOut: string, bedsRequired: number, excludeBookingId: number | null) => {
        const availability = await getRoomAvailability(roomId, checkIn, checkOut, bedsRequired, excludeBookingId);
        return availability;
    }

    useEffect(() => {
        fetchRooms();
        }, []);
        
    return {
        rooms,
        loading, error, fetchRooms,
        beds,
        addRoom,
        removeRoom,
        updateSingleRoom,
        addBedToRoom,
        removeBedFromRoom,
        updateBedName,
        IsRoomAvailable,
        };
}