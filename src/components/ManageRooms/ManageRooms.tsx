'use client';
import React, { useState } from 'react';
import RoomCard from './RoomCard';
import AddRoomModal from './AddRoomModal';
import Modal from '../Modal/Modal';
import { useRooms } from '@/hooks/useRooms';

export default function ManageRooms() {
    const {rooms, addRoom, removeRoom, updateSingleRoom, addBedToRoom, removeBedFromRoom, updateBedName } = useRooms();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
  
    const handleAddRoom = async (name: string) => {
        await addRoom({ room_name: name });
        setSuccessMessage(`Room "${name}" added successfully.`);
        setTimeout(() => setSuccessMessage(''), 10000);
    };

    const handleEditRoom = async (roomId: number, newName: string) => {
        await updateSingleRoom(roomId, newName);
        setSuccessMessage(`Room name updated to "${newName}" successfully.`);
        setTimeout(() => setSuccessMessage(''), 10000);
    }

    const handleDeleteRoom = async (roomId: number, roomName: string) => {
        await removeRoom(roomId);
        setSuccessMessage(`Room "${roomName}" deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 10000);
    }; 

    const handleAddBed = async (roomId: number, bedName: string) => {
        await addBedToRoom(roomId, bedName);
        setSuccessMessage(`Bed "${bedName}" added successfully.`);
        setTimeout(() => setSuccessMessage(''), 10000);
    };

    const handleDeleteBed = async (roomId: number, bedId: number) => {
        await removeBedFromRoom(roomId, bedId);
        setSuccessMessage(`Bed deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 10000);
    };

    const handleEditBed = async (bedId: number, newName: string) => {
        await updateBedName(bedId, newName);
        setSuccessMessage(`Bed name updated to "${newName}" successfully.`);
        setTimeout(() => setSuccessMessage(''), 10000);
    };

  return (
    <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Room & Bed Manager</h1>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
                >
                + Add Room
            </button>
        </div>

        <div className="space-y-6">
            {successMessage && (
            <div className="mb-4 p-3 rounded bg-green-100 text-green-800 border border-green-300 text-sm shadow-sm transition-opacity duration-300">
                {successMessage}
            </div>
            )}
            {rooms.map((room) => (
            <RoomCard 
                key={room.room_id} 
                room={room}
                renameRoom={handleEditRoom}
                removeRoom={handleDeleteRoom}
                addBed={handleAddBed}
                removeBed = {handleDeleteBed}
                updateBed = {handleEditBed} />
            ))}
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Room">
            <AddRoomModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleAddRoom}
        />
        </Modal>
        
            
    </div>
  );
}
