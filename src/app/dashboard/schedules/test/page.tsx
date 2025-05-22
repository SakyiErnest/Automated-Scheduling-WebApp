'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { schedulerApi } from '@/lib/api';

export default function TestScheduler() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testScheduler = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sample data for testing
      const testData = {
        school_settings: {
          startTime: '08:00',
          endTime: '15:30',
          lessonDuration: 60,
          breakDuration: 15,
          hasBreakfastBreak: false,
          breakfastBreakStartTime: '10:00',
          breakfastBreakDuration: 25,
          lunchBreakDuration: 45,
          lunchBreakStartTime: '12:00',
          lessonsPerDay: 6,
          daysPerWeek: 5,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          useRoomConstraints: true,
          minSubjectsPerDay: undefined,
          exactLessonsPerDay: undefined,
          minFreeDaysPerWeek: undefined,
        },
        teachers: [
          {
            id: 'teacher-1',
            name: 'John Doe',
            subjects: ['subject-1', 'subject-2'],
            maxHoursPerDay: 5,
            maxHoursPerWeek: 20,
          },
          {
            id: 'teacher-2',
            name: 'Jane Smith',
            subjects: ['subject-3', 'subject-4'],
            maxHoursPerDay: 4,
            maxHoursPerWeek: 16,
          },
        ],
        classes: [
          {
            id: 'class-1',
            name: 'Class 1A',
            requiredSubjects: ['subject-1', 'subject-3'],
          },
          {
            id: 'class-2',
            name: 'Class 1B',
            requiredSubjects: ['subject-2', 'subject-4'],
          },
        ],
        subjects: [
          {
            id: 'subject-1',
            name: 'Mathematics',
            hoursPerWeek: 5,
          },
          {
            id: 'subject-2',
            name: 'Science',
            hoursPerWeek: 4,
          },
          {
            id: 'subject-3',
            name: 'English',
            hoursPerWeek: 5,
          },
          {
            id: 'subject-4',
            name: 'History',
            hoursPerWeek: 3,
          },
        ],
        rooms: [
          {
            id: 'room-1',
            name: 'Room 101',
            capacity: 30,
          },
          {
            id: 'room-2',
            name: 'Room 102',
            capacity: 25,
          },
        ],
      };

      const response = await schedulerApi.generateSchedule(testData);
      setResult(response.data);
    } catch (err: unknown) {
      console.error('Error testing scheduler:', err);
      setError(err instanceof Error ? err.message : 'Failed to test scheduler');
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await schedulerApi.healthCheck();
      setResult(response.data);
    } catch (err: unknown) {
      console.error('Error checking health:', err);
      setError(err instanceof Error ? err.message : 'Failed to check health');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Scheduler</h1>
        <button
          type="button"
          onClick={() => router.push('/dashboard/schedules')}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          Back to Schedules
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Scheduler API Tests</h2>

        <div className="space-y-4">
          <div>
            <button
              type="button"
              onClick={testHealthCheck}
              disabled={loading}
              className="mr-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              Test Health Check
            </button>

            <button
              type="button"
              onClick={testScheduler}
              disabled={loading}
              className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-green-300"
            >
              Test Generate Schedule
            </button>
          </div>

          {loading && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <span>Loading...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
