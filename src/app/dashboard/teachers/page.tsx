'use client';

import { useState, useEffect } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { teachersCollection, subjectsCollection } from '@/lib/firestore';
import { Teacher, Subject } from '@/types';

export default function TeachersPage() {
  const { currentSchool } = useSchool();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(5);
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState(20);
  
  // Fetch teachers and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (!currentSchool) {
        setTeachers([]);
        setSubjects([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch teachers
        const fetchedTeachers = await teachersCollection.getAll<Teacher>(currentSchool.id);
        setTeachers(fetchedTeachers);
        
        // Fetch subjects
        const fetchedSubjects = await subjectsCollection.getAll<Subject>(currentSchool.id);
        setSubjects(fetchedSubjects);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load teachers. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentSchool]);
  
  // Reset form
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSelectedSubjects([]);
    setMaxHoursPerDay(5);
    setMaxHoursPerWeek(20);
    setEditingTeacher(null);
  };
  
  // Set form values when editing
  useEffect(() => {
    if (editingTeacher) {
      setName(editingTeacher.name || '');
      setEmail(editingTeacher.email || '');
      setPhone(editingTeacher.phone || '');
      setSelectedSubjects(editingTeacher.subjects || []);
      setMaxHoursPerDay(editingTeacher.maxHoursPerDay || 5);
      setMaxHoursPerWeek(editingTeacher.maxHoursPerWeek || 20);
      setShowAddForm(true);
    }
  }, [editingTeacher]);
  
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
      
      const teacherData = {
        schoolId: currentSchool.id,
        name,
        email,
        phone,
        subjects: selectedSubjects,
        maxHoursPerDay,
        maxHoursPerWeek,
      };
      
      if (editingTeacher) {
        // Update existing teacher
        await teachersCollection.update<Teacher>(editingTeacher.id, teacherData);
      } else {
        // Create new teacher
        await teachersCollection.create<Teacher>(teacherData);
      }
      
      // Refresh teachers list
      const updatedTeachers = await teachersCollection.getAll<Teacher>(currentSchool.id);
      setTeachers(updatedTeachers);
      
      // Reset form and hide it
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError('Failed to save teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle teacher deletion
  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await teachersCollection.delete(teacher.id);
      
      // Refresh teachers list
      const updatedTeachers = await teachersCollection.getAll<Teacher>(currentSchool!.id);
      setTeachers(updatedTeachers);
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Failed to delete teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle subject selection
  const handleSubjectChange = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };
  
  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };
  
  if (!currentSchool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please select a school first to manage teachers.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Teacher'}
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
            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Teacher Name *
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
                <label className="block text-gray-700 mb-2" htmlFor="maxHoursPerDay">
                  Max Hours Per Day
                </label>
                <input
                  id="maxHoursPerDay"
                  type="number"
                  min="1"
                  max="12"
                  value={maxHoursPerDay}
                  onChange={(e) => setMaxHoursPerDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="maxHoursPerWeek">
                  Max Hours Per Week
                </label>
                <input
                  id="maxHoursPerWeek"
                  type="number"
                  min="1"
                  max="40"
                  value={maxHoursPerWeek}
                  onChange={(e) => setMaxHoursPerWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Subjects *
              </label>
              {subjects.length === 0 ? (
                <div className="text-yellow-600 mb-2">
                  No subjects available. Please add subjects first.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {subjects.map((subject) => (
                    <label key={subject.id} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() => handleSubjectChange(subject.id)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">{subject.name}</span>
                    </label>
                  ))}
                </div>
              )}
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
                disabled={loading || subjects.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {loading ? 'Saving...' : 'Save Teacher'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading && !showAddForm ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No teachers found. Add your first teacher to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Teacher
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
                  Subjects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{teacher.email}</div>
                    <div className="text-sm text-gray-500">{teacher.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {teacher.subjects.map(subjectId => (
                        <span key={subjectId} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                          {getSubjectName(subjectId)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {teacher.maxHoursPerDay} per day / {teacher.maxHoursPerWeek} per week
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingTeacher(teacher)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(teacher)}
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
