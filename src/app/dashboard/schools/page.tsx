'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { schoolsCollection } from '@/lib/firestore';
import { School } from '@/types';

export default function SchoolsPage() {
  const { currentUser } = useAuth();
  const { schools, refreshSchools } = useSchool();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Reset form
  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setEditingSchool(null);
  };

  // Set form values when editing
  useEffect(() => {
    if (editingSchool) {
      setName(editingSchool.name || '');
      setAddress(editingSchool.address || '');
      setPhone(editingSchool.phone || '');
      setEmail(editingSchool.email || '');
      setWebsite(editingSchool.website || '');
      setShowAddForm(true);
    }
  }, [editingSchool]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to perform this action');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const schoolData = {
        name,
        address,
        phone,
        email,
        website,
        userId: currentUser.uid,
      };
      
      if (editingSchool) {
        // Update existing school
        await schoolsCollection.update<School>(editingSchool.id, schoolData);
      } else {
        // Create new school
        await schoolsCollection.create<School>(schoolData);
      }
      
      // Refresh schools list
      await refreshSchools();
      
      // Reset form and hide it
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving school:', err);
      setError('Failed to save school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle school deletion
  const handleDelete = async (school: School) => {
    if (!confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await schoolsCollection.delete(school.id);
      await refreshSchools();
    } catch (err) {
      console.error('Error deleting school:', err);
      setError('Failed to delete school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schools</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add School'}
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
            {editingSchool ? 'Edit School' : 'Add New School'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  School Name *
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
                <label className="block text-gray-700 mb-2" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="website">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
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
                {loading ? 'Saving...' : 'Save School'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showAddForm ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No schools found. Add your first school to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add School
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{school.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{school.email}</div>
                    <div className="text-sm text-gray-500">{school.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{school.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingSchool(school)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(school)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
