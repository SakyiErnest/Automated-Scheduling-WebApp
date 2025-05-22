'use client';

import { useState, useEffect } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { classesCollection, subjectsCollection } from '@/lib/firestore';
import { Class, Subject } from '@/types';

export default function ClassesPage() {
  const { currentSchool } = useSchool();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [students, setStudents] = useState<number | undefined>(undefined);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  // Fetch classes and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (!currentSchool) {
        setClasses([]);
        setSubjects([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch classes
        const fetchedClasses = await classesCollection.getAll<Class>(currentSchool.id);
        setClasses(fetchedClasses);
        
        // Fetch subjects
        const fetchedSubjects = await subjectsCollection.getAll<Subject>(currentSchool.id);
        setSubjects(fetchedSubjects);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentSchool]);
  
  // Reset form
  const resetForm = () => {
    setName('');
    setGrade('');
    setSection('');
    setStudents(undefined);
    setSelectedSubjects([]);
    setEditingClass(null);
  };
  
  // Set form values when editing
  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name || '');
      setGrade(editingClass.grade || '');
      setSection(editingClass.section || '');
      setStudents(editingClass.students);
      setSelectedSubjects(editingClass.requiredSubjects || []);
      setShowAddForm(true);
    }
  }, [editingClass]);
  
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
      
      const classData = {
        schoolId: currentSchool.id,
        name,
        grade,
        section,
        students,
        requiredSubjects: selectedSubjects,
      };
      
      if (editingClass) {
        // Update existing class
        await classesCollection.update<Class>(editingClass.id, classData);
      } else {
        // Create new class
        await classesCollection.create<Class>(classData);
      }
      
      // Refresh classes list
      const updatedClasses = await classesCollection.getAll<Class>(currentSchool.id);
      setClasses(updatedClasses);
      
      // Reset form and hide it
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving class:', err);
      setError('Failed to save class. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle class deletion
  const handleDelete = async (classItem: Class) => {
    if (!confirm(`Are you sure you want to delete ${classItem.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await classesCollection.delete(classItem.id);
      
      // Refresh classes list
      const updatedClasses = await classesCollection.getAll<Class>(currentSchool!.id);
      setClasses(updatedClasses);
    } catch (err) {
      console.error('Error deleting class:', err);
      setError('Failed to delete class. Please try again.');
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
          Please select a school first to manage classes.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Class'}
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
            {editingClass ? 'Edit Class' : 'Add New Class'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Class Name *
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
                <label className="block text-gray-700 mb-2" htmlFor="grade">
                  Grade
                </label>
                <input
                  id="grade"
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="section">
                  Section
                </label>
                <input
                  id="section"
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="students">
                  Number of Students
                </label>
                <input
                  id="students"
                  type="number"
                  min="1"
                  value={students === undefined ? '' : students}
                  onChange={(e) => setStudents(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Required Subjects *
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
                {loading ? 'Saving...' : 'Save Class'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading && !showAddForm ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No classes found. Add your first class to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{classItem.name}</h3>
                    {(classItem.grade || classItem.section) && (
                      <p className="text-sm text-gray-500">
                        {classItem.grade && `Grade: ${classItem.grade}`}
                        {classItem.grade && classItem.section && ' | '}
                        {classItem.section && `Section: ${classItem.section}`}
                      </p>
                    )}
                  </div>
                  {classItem.students !== undefined && (
                    <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {classItem.students} students
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Required Subjects:</h4>
                  <div className="flex flex-wrap gap-1">
                    {classItem.requiredSubjects.map(subjectId => (
                      <span key={subjectId} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {getSubjectName(subjectId)}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingClass(classItem)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(classItem)}
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
