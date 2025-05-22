'use client';

import { useState, useEffect } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { subjectsCollection } from '@/lib/firestore';
import { Subject } from '@/types';

export default function SubjectsPage() {
  const { currentSchool } = useSchool();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Generate subject color class
  const getSubjectColorClass = (id: string) => {
    return `subject-color-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  };

  // Generate dynamic CSS for subject colors
  const generateSubjectColorStyles = () => {
    if (!subjects.length) return '';

    return subjects.map(subject => {
      const color = subject.color || '#3B82F6';
      return `.subject-color-${subject.id.replace(/[^a-zA-Z0-9]/g, '-')} { background-color: ${color}; }`;
    }).join('\n');
  };

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6'); // Default blue color

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!currentSchool) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedSubjects = await subjectsCollection.getAll<Subject>(currentSchool.id);
        setSubjects(fetchedSubjects);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [currentSchool]);

  // Reset form
  const resetForm = () => {
    setName('');
    setCode('');
    setHoursPerWeek(5);
    setDescription('');
    setColor('#3B82F6');
    setEditingSubject(null);
  };

  // Set form values when editing
  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name || '');
      setCode(editingSubject.code || '');
      setHoursPerWeek(editingSubject.hoursPerWeek || 5);
      setDescription(editingSubject.description || '');
      setColor(editingSubject.color || '#3B82F6');
      setShowAddForm(true);
    }
  }, [editingSubject]);

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

      const subjectData = {
        schoolId: currentSchool.id,
        name,
        code,
        hoursPerWeek,
        description,
        color,
      };

      if (editingSubject) {
        // Update existing subject
        await subjectsCollection.update<Subject>(editingSubject.id, subjectData);
      } else {
        // Create new subject
        await subjectsCollection.create<Subject>(subjectData);
      }

      // Refresh subjects list
      const updatedSubjects = await subjectsCollection.getAll<Subject>(currentSchool.id);
      setSubjects(updatedSubjects);

      // Reset form and hide it
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving subject:', err);
      setError('Failed to save subject. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle subject deletion
  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Are you sure you want to delete ${subject.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await subjectsCollection.delete(subject.id);

      // Refresh subjects list
      const updatedSubjects = await subjectsCollection.getAll<Subject>(currentSchool!.id);
      setSubjects(updatedSubjects);
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError('Failed to delete subject. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentSchool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please select a school first to manage subjects.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dynamic styles for subject colors */}
      <style dangerouslySetInnerHTML={{ __html: generateSubjectColorStyles() }} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Subject'}
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
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Subject Name *
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
                <label className="block text-gray-700 mb-2" htmlFor="code">
                  Subject Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="hoursPerWeek">
                  Hours Per Week *
                </label>
                <input
                  id="hoursPerWeek"
                  type="number"
                  min="1"
                  max="20"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="color">
                  Color
                </label>
                <input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
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
                {loading ? 'Saving...' : 'Save Subject'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showAddForm ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No subjects found. Add your first subject to get started.</p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div
                className={`h-2 ${getSubjectColorClass(subject.id)}`}
              ></div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{subject.name}</h3>
                    {subject.code && (
                      <p className="text-sm text-gray-500">Code: {subject.code}</p>
                    )}
                  </div>
                  <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {subject.hoursPerWeek} hrs/week
                  </div>
                </div>
                {subject.description && (
                  <p className="text-sm text-gray-600 mt-2">{subject.description}</p>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingSubject(subject)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(subject)}
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
