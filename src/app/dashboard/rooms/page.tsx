'use client';

import { useState, useEffect } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { roomsCollection } from '@/lib/firestore';
import { Room } from '@/types';

export default function RoomsPage() {
  const { currentSchool } = useSchool();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // Available features
  const availableFeatures = [
    { value: 'PROJECTOR', label: 'Projector' },
    { value: 'WHITEBOARD', label: 'Whiteboard' },
    { value: 'COMPUTERS', label: 'Computers' },
    { value: 'SCIENCE_LAB', label: 'Science Lab' },
    { value: 'MUSIC_ROOM', label: 'Music Room' },
    { value: 'ART_ROOM', label: 'Art Room' },
    { value: 'GYMNASIUM', label: 'Gymnasium' },
    { value: 'LIBRARY', label: 'Library' },
  ];
  
  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentSchool) {
        setRooms([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const fetchedRooms = await roomsCollection.getAll<Room>(currentSchool.id);
        setRooms(fetchedRooms);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError('Failed to load rooms. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [currentSchool]);
  
  // Reset form
  const resetForm = () => {
    setName('');
    setCapacity(30);
    setBuilding('');
    setFloor('');
    setRoomNumber('');
    setSelectedFeatures([]);
    setEditingRoom(null);
  };
  
  // Set form values when editing
  useEffect(() => {
    if (editingRoom) {
      setName(editingRoom.name || '');
      setCapacity(editingRoom.capacity || 30);
      setBuilding(editingRoom.building || '');
      setFloor(editingRoom.floor || '');
      setRoomNumber(editingRoom.roomNumber || '');
      setSelectedFeatures(editingRoom.features || []);
      setShowAddForm(true);
    }
  }, [editingRoom]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSchool) {
      setError('Please select a school first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const roomData = {
        schoolId: currentSchool.id,
        name,
        capacity,
        building,
        floor,
        roomNumber,
        features: selectedFeatures,
      };
      
      if (editingRoom) {
        // Update existing room
        await roomsCollection.update<Room>(editingRoom.id, roomData);
      } else {
        // Create new room
        await roomsCollection.create<Room>(roomData);
      }
      
      // Refresh rooms list
      const updatedRooms = await roomsCollection.getAll<Room>(currentSchool.id);
      setRooms(updatedRooms);
      
      // Reset form and hide it
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving room:', err);
      setError('Failed to save room. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle room deletion
  const handleDelete = async (room: Room) => {
    if (!confirm(`Are you sure you want to delete ${room.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await roomsCollection.delete(room.id);
      
      // Refresh rooms list
      const updatedRooms = await roomsCollection.getAll<Room>(currentSchool!.id);
      setRooms(updatedRooms);
    } catch (err) {
      console.error('Error deleting room:', err);
      setError('Failed to delete room. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle feature selection
  const handleFeatureChange = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };
  
  // Get feature label by value
  const getFeatureLabel = (featureValue: string) => {
    const feature = availableFeatures.find(f => f.value === featureValue);
    return feature ? feature.label : featureValue;
  };
  
  if (!currentSchool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please select a school first to manage rooms.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Room'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRoom ? 'Edit Room' : 'Add New Room'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Room Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="capacity">
                  Capacity *
                </label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="building">
                  Building
                </label>
                <input
                  id="building"
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="floor">
                  Floor
                </label>
                <input
                  id="floor"
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="roomNumber">
                  Room Number
                </label>
                <input
                  id="roomNumber"
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Room Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableFeatures.map((feature) => (
                  <label key={feature.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.value)}
                      onChange={() => handleFeatureChange(feature.value)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {loading ? 'Saving...' : 'Save Room'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading && !showAddForm ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No rooms found. Add your first room to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      {[
                        room.building && `Building: ${room.building}`,
                        room.floor && `Floor: ${room.floor}`,
                        room.roomNumber && `Room: ${room.roomNumber}`,
                      ]
                        .filter(Boolean)
                        .join(' | ')}
                    </p>
                  </div>
                  <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Capacity: {room.capacity}
                  </div>
                </div>
                
                {room.features && room.features.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {room.features.map(feature => (
                        <span key={feature} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {getFeatureLabel(feature)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingRoom(room)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
