'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSchool } from '@/contexts/SchoolContext';
import { schedulesCollection, schoolSettingsCollection, teachersCollection, classesCollection, subjectsCollection, roomsCollection } from '@/lib/firestore';
import { schedulerApi } from '@/lib/api';
import { Schedule, SchoolSettings, Teacher, Class, Subject, Room, ScheduleGenerationInput } from '@/types';

export default function SchedulesPage() {
  const router = useRouter();
  const { currentSchool } = useSchool();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!currentSchool) {
        setSchedules([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedSchedules = await schedulesCollection.getAll<Schedule>(currentSchool.id);
        setSchedules(fetchedSchedules);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError('Failed to load schedules. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [currentSchool]);

  const [validating, setValidating] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  // Prepare scheduler data
  const prepareSchedulerData = async () => {
    if (!currentSchool) {
      setError('Please select a school first');
      return null;
    }

    // Fetch all required data
    const settings = await schoolSettingsCollection.get<SchoolSettings>(currentSchool.id);
    const teachers = await teachersCollection.getAll<Teacher>(currentSchool.id);
    const classes = await classesCollection.getAll<Class>(currentSchool.id);
    const subjects = await subjectsCollection.getAll<Subject>(currentSchool.id);
    const rooms = await roomsCollection.getAll<Room>(currentSchool.id);

    // Check if we have all required data
    if (!settings) {
      setError('School settings are not configured. Please configure them first.');
      return null;
    }

    if (teachers.length === 0) {
      setError('No teachers found. Please add teachers first.');
      return null;
    }

    if (classes.length === 0) {
      setError('No classes found. Please add classes first.');
      return null;
    }

    if (subjects.length === 0) {
      setError('No subjects found. Please add subjects first.');
      return null;
    }

    if (rooms.length === 0) {
      setError('No rooms found. Please add rooms first.');
      return null;
    }

    // Prepare data for the scheduler API
    const schedulerData: ScheduleGenerationInput = {
      school_settings: {
        startTime: settings.startTime,
        endTime: settings.endTime,
        lessonDuration: settings.lessonDuration,
        breakDuration: settings.breakDuration,
        hasBreakfastBreak: settings.hasBreakfastBreak,
        breakfastBreakStartTime: settings.breakfastBreakStartTime,
        breakfastBreakDuration: settings.breakfastBreakDuration,
        lunchBreakDuration: settings.lunchBreakDuration,
        lunchBreakStartTime: settings.lunchBreakStartTime,
        lessonsPerDay: settings.lessonsPerDay,
        daysPerWeek: settings.daysPerWeek,
        workingDays: settings.workingDays,
        useRoomConstraints: settings.useRoomConstraints,
        minSubjectsPerDay: settings.minSubjectsPerDay,
        exactLessonsPerDay: settings.exactLessonsPerDay,
        minFreeDaysPerWeek: settings.minFreeDaysPerWeek,
      },
      teachers: teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        subjects: teacher.subjects,
        maxHoursPerDay: teacher.maxHoursPerDay,
        maxHoursPerWeek: teacher.maxHoursPerWeek,
        availability: teacher.availability,
      })),
      classes: classes.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        requiredSubjects: classItem.requiredSubjects,
      })),
      subjects: subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        hoursPerWeek: subject.hoursPerWeek,
      })),
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
      })),
    };

    return schedulerData;
  };

  // Validate constraints
  const handleValidateConstraints = async () => {
    try {
      setValidating(true);
      setError(null);
      setValidationIssues([]);

      const schedulerData = await prepareSchedulerData();
      if (!schedulerData) return;

      // Call the validation API
      const response = await schedulerApi.validateConstraints(schedulerData as unknown as Record<string, unknown>);

      if (response.data && response.data.status === 'success') {
        const feasible = response.data.feasible;
        const issues = response.data.issues || [];

        setValidationIssues(issues);

        if (feasible) {
          alert('Validation successful! You can now generate the schedule.');
        } else {
          setError('There are issues with your data that need to be resolved before generating a schedule.');
        }
      } else {
        setError('Failed to validate constraints. Please try again.');
      }
    } catch (err) {
      console.error('Error validating constraints:', err);
      setError('Failed to validate constraints. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  // Generate new schedule
  const handleGenerateSchedule = async () => {
    try {
      setGenerating(true);
      setError(null);

      const schedulerData = await prepareSchedulerData();
      if (!schedulerData) return;

      // Call the scheduler API
      const response = await schedulerApi.generateSchedule(schedulerData as unknown as Record<string, unknown>);

      if (response.data && response.data.status === 'success') {
        // Create a new schedule in Firestore
        const newSchedule = {
          schoolId: currentSchool!.id,
          name: `Schedule ${new Date().toLocaleDateString()}`,
          status: 'draft' as const,
          entries: response.data.data.entries,
        };

        await schedulesCollection.create<Schedule>(newSchedule);

        // Refresh schedules list
        const updatedSchedules = await schedulesCollection.getAll<Schedule>(currentSchool!.id);
        setSchedules(updatedSchedules);

        // Show success message
        alert('Schedule generated successfully!');
      } else {
        setError('Failed to generate schedule. Please try again.');
      }
    } catch (err) {
      console.error('Error generating schedule:', err);
      setError('Failed to generate schedule. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle schedule deletion
  const handleDelete = async (schedule: Schedule) => {
    if (!confirm(`Are you sure you want to delete this schedule? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await schedulesCollection.delete(schedule.id);

      // Refresh schedules list
      const updatedSchedules = await schedulesCollection.getAll<Schedule>(currentSchool!.id);
      setSchedules(updatedSchedules);
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (!currentSchool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please select a school first to manage schedules.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Schedules</h1>
        <div className="flex flex-wrap gap-2">
          {currentSchool && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/schools/${currentSchool.id}/settings`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              School Settings
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/dashboard/schedules/test')}
            className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Test Scheduler
          </button>
          <button
            type="button"
            onClick={handleValidateConstraints}
            disabled={validating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {validating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating...
              </>
            ) : 'Validate Constraints'}
          </button>
          <button
            type="button"
            onClick={handleGenerateSchedule}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : 'Generate New Schedule'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm text-red-700">{error}</div>
            {error.includes('School settings are not configured') && currentSchool && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/schools/${currentSchool.id}/settings`)}
                className="ml-4 px-3 py-1.5 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Configure Settings
              </button>
            )}
          </div>
        </div>
      )}

      {validationIssues.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md shadow-sm">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Validation Issues:</h3>
          <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
            {validationIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
          <p className="mt-1 text-sm text-gray-500 mb-6">Generate your first schedule to get started.</p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={handleGenerateSchedule}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Schedule'}
            </button>
            {currentSchool && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/schools/${currentSchool.id}/settings`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Configure School Settings
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entries
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                    {schedule.description && (
                      <div className="text-sm text-gray-500">{schedule.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(schedule.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${schedule.status === 'published' ? 'bg-green-100 text-green-800' :
                        schedule.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {schedule.entries ? schedule.entries.length : 0} entries
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/schedules/${schedule.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(schedule)}
                      className="text-red-600 hover:text-red-900 transition-colors"
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
