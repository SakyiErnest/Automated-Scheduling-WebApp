'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { schoolsCollection, schoolSettingsCollection } from '@/lib/firestore';
import { School, SchoolSettings } from '@/types';

export default function SchoolSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('15:30');
  const [lessonDuration, setLessonDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);

  // Breakfast break settings
  const [hasBreakfastBreak, setHasBreakfastBreak] = useState(false);
  const [breakfastBreakStartTime, setBreakfastBreakStartTime] = useState('10:00');
  const [breakfastBreakDuration, setBreakfastBreakDuration] = useState(25);

  // Lunch break settings
  const [lunchBreakDuration, setLunchBreakDuration] = useState(45);
  const [lunchBreakStartTime, setLunchBreakStartTime] = useState('12:00');

  const [lessonsPerDay, setLessonsPerDay] = useState(6);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [workingDays, setWorkingDays] = useState<string[]>([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'
  ]);

  // Room constraint settings
  const [useRoomConstraints, setUseRoomConstraints] = useState(true);

  // Advanced scheduling constraints
  const [minSubjectsPerDay, setMinSubjectsPerDay] = useState<number | undefined>(undefined);
  const [exactLessonsPerDay, setExactLessonsPerDay] = useState<number | undefined>(undefined);
  const [minFreeDaysPerWeek, setMinFreeDaysPerWeek] = useState<number | undefined>(0);

  // Days of the week options
  const daysOfWeek = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' },
  ];

  // Fetch school and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch school
        const schoolData = await schoolsCollection.get<School>(schoolId);
        if (!schoolData) {
          setError('School not found');
          return;
        }
        setSchool(schoolData);

        // Fetch settings
        const settingsData = await schoolSettingsCollection.get<SchoolSettings>(schoolId);
        if (settingsData) {
          setSettings(settingsData);
          // Populate form with existing settings
          setStartTime(settingsData.startTime);
          setEndTime(settingsData.endTime);
          setLessonDuration(settingsData.lessonDuration);
          setBreakDuration(settingsData.breakDuration);

          // Load breakfast break settings if they exist
          if (settingsData.hasBreakfastBreak !== undefined) {
            setHasBreakfastBreak(settingsData.hasBreakfastBreak);
          }
          if (settingsData.breakfastBreakStartTime) {
            setBreakfastBreakStartTime(settingsData.breakfastBreakStartTime);
          }
          if (settingsData.breakfastBreakDuration) {
            setBreakfastBreakDuration(settingsData.breakfastBreakDuration);
          }

          // Load room constraint settings if they exist
          if (settingsData.useRoomConstraints !== undefined) {
            setUseRoomConstraints(settingsData.useRoomConstraints);
          }

          setLunchBreakDuration(settingsData.lunchBreakDuration);
          setLunchBreakStartTime(settingsData.lunchBreakStartTime);
          setLessonsPerDay(settingsData.lessonsPerDay);
          setDaysPerWeek(settingsData.daysPerWeek);
          setWorkingDays(settingsData.workingDays || [
            'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'
          ]);

          // Load advanced scheduling constraints if they exist
          if (settingsData.minSubjectsPerDay !== undefined) {
            setMinSubjectsPerDay(settingsData.minSubjectsPerDay);
          }
          if (settingsData.exactLessonsPerDay !== undefined) {
            setExactLessonsPerDay(settingsData.exactLessonsPerDay);
          }
          if (settingsData.minFreeDaysPerWeek !== undefined) {
            setMinFreeDaysPerWeek(settingsData.minFreeDaysPerWeek);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load school settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      // If breakfast break is enabled, set breakDuration to 0
      const effectiveBreakDuration = hasBreakfastBreak ? 0 : breakDuration;

      const settingsData = {
        schoolId,
        startTime,
        endTime,
        lessonDuration,
        breakDuration: effectiveBreakDuration,

        // Include breakfast break settings
        hasBreakfastBreak,
        breakfastBreakStartTime,
        breakfastBreakDuration,

        lunchBreakDuration,
        lunchBreakStartTime,
        lessonsPerDay,
        daysPerWeek,
        workingDays,

        // Include room constraint settings
        useRoomConstraints,

        // Include advanced scheduling constraints
        ...(minSubjectsPerDay !== undefined && { minSubjectsPerDay }),
        ...(exactLessonsPerDay !== undefined && { exactLessonsPerDay }),
        ...(minFreeDaysPerWeek !== undefined && { minFreeDaysPerWeek }),
      };

      if (settings) {
        // Update existing settings
        await schoolSettingsCollection.update<SchoolSettings>(settings.id, settingsData);
      } else {
        // Create new settings
        await schoolSettingsCollection.create<SchoolSettings>(settingsData);
      }

      // Show success message or redirect
      alert('School settings saved successfully!');
      router.push(`/dashboard/schedules`);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle working days change
  const handleWorkingDayChange = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Set breakDuration to 0 when hasBreakfastBreak is toggled on
  useEffect(() => {
    if (hasBreakfastBreak) {
      setBreakDuration(0);
    }
  }, [hasBreakfastBreak]);

  // Generate time slots preview based on current settings
  const generateTimeSlots = () => {
    const slots = [];

    // Convert times to minutes since midnight
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Breakfast break times
    const breakfastStartMinutes = hasBreakfastBreak ? timeToMinutes(breakfastBreakStartTime) : -1;
    const breakfastEndMinutes = hasBreakfastBreak ? breakfastStartMinutes + breakfastBreakDuration : -1;

    // Lunch break times
    const lunchStartMinutes = timeToMinutes(lunchBreakStartTime);
    const lunchEndMinutes = lunchStartMinutes + lunchBreakDuration;

    let currentMinutes = startMinutes;
    let slotNumber = 1;

    while (currentMinutes + lessonDuration <= endMinutes) {
      // Check if this lesson would overlap with breakfast break
      if (hasBreakfastBreak && currentMinutes < breakfastEndMinutes && currentMinutes + lessonDuration > breakfastStartMinutes) {
        // Add lesson before breakfast if there's time
        if (currentMinutes < breakfastStartMinutes) {
          slots.push({
            slotNumber: slotNumber++,
            startTime: minutesToTime(currentMinutes),
            endTime: minutesToTime(breakfastStartMinutes),
            type: 'lesson'
          });
        }

        // Add breakfast break
        slots.push({
          slotNumber: null,
          startTime: minutesToTime(breakfastStartMinutes),
          endTime: minutesToTime(breakfastEndMinutes),
          type: 'breakfast'
        });

        currentMinutes = breakfastEndMinutes;
      }
      // Check if this lesson would overlap with lunch break
      else if (currentMinutes < lunchEndMinutes && currentMinutes + lessonDuration > lunchStartMinutes) {
        // Add lesson before lunch if there's time
        if (currentMinutes < lunchStartMinutes) {
          slots.push({
            slotNumber: slotNumber++,
            startTime: minutesToTime(currentMinutes),
            endTime: minutesToTime(lunchStartMinutes),
            type: 'lesson'
          });
        }

        // Add lunch break
        slots.push({
          slotNumber: null,
          startTime: minutesToTime(lunchStartMinutes),
          endTime: minutesToTime(lunchEndMinutes),
          type: 'lunch'
        });

        currentMinutes = lunchEndMinutes;
      } else {
        // Regular lesson
        const slotEndMinutes = currentMinutes + lessonDuration;

        slots.push({
          slotNumber: slotNumber++,
          startTime: minutesToTime(currentMinutes),
          endTime: minutesToTime(slotEndMinutes),
          type: 'lesson'
        });

        // If breakfast break is enabled, we don't add regular breaks between lessons
        if (hasBreakfastBreak) {
          // Just move to the next lesson without a break
          currentMinutes = slotEndMinutes;
        } else {
          // Add break if not the last lesson
          if (slotEndMinutes + breakDuration + lessonDuration <= endMinutes) {
            slots.push({
              slotNumber: null,
              startTime: minutesToTime(slotEndMinutes),
              endTime: minutesToTime(slotEndMinutes + breakDuration),
              type: 'break'
            });

            currentMinutes = slotEndMinutes + breakDuration;
          } else {
            currentMinutes = slotEndMinutes;
          }
        }
      }
    }

    return slots;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !school) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">School Settings</h1>
        <p className="text-gray-600">Configure timetable settings for {school?.name}</p>
        <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="font-medium">These settings are required for generating schedules.</p>
          <p className="text-sm mt-1">Define your school hours, lesson durations, and working days to create optimal timetables.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="startTime">
                School Start Time
                <span className="ml-1 text-xs text-gray-500">(When the school day begins)</span>
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="endTime">
                School End Time
                <span className="ml-1 text-xs text-gray-500">(When the school day ends)</span>
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="lessonDuration">
                Lesson Duration (minutes)
                <span className="ml-1 text-xs text-gray-500">(Length of each class period)</span>
              </label>
              <input
                id="lessonDuration"
                type="number"
                min="15"
                max="120"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="breakDuration">
                Break Duration (minutes)
                <span className="ml-1 text-xs text-gray-500">
                  {hasBreakfastBreak
                    ? "(Disabled when breakfast break is enabled)"
                    : "(Time between lessons)"}
                </span>
              </label>
              <input
                id="breakDuration"
                type="number"
                min="0"
                max="60"
                value={hasBreakfastBreak ? 0 : breakDuration}
                onChange={(e) => !hasBreakfastBreak && setBreakDuration(parseInt(e.target.value))}
                className={`w-full px-3 py-2 border border-gray-300 rounded ${hasBreakfastBreak ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={hasBreakfastBreak}
                required
              />
              {hasBreakfastBreak && (
                <p className="mt-1 text-xs text-gray-500">
                  Break duration is set to 0 when breakfast break is enabled to avoid redundant breaks.
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="hasBreakfastBreak">
                Include Breakfast Break
                <span className="ml-1 text-xs text-gray-500">(Whether to schedule a breakfast break)</span>
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    id="hasBreakfastBreak"
                    type="checkbox"
                    checked={hasBreakfastBreak}
                    onChange={(e) => setHasBreakfastBreak(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Enable breakfast break (disables regular breaks between lessons)</span>
                </label>
              </div>
            </div>

            {hasBreakfastBreak && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="breakfastBreakStartTime">
                    Breakfast Break Start Time
                    <span className="ml-1 text-xs text-gray-500">(When breakfast period begins)</span>
                  </label>
                  <input
                    id="breakfastBreakStartTime"
                    type="time"
                    value={breakfastBreakStartTime}
                    onChange={(e) => setBreakfastBreakStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required={hasBreakfastBreak}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="breakfastBreakDuration">
                    Breakfast Break Duration (minutes)
                    <span className="ml-1 text-xs text-gray-500">(Length of breakfast period)</span>
                  </label>
                  <input
                    id="breakfastBreakDuration"
                    type="number"
                    min="5"
                    max="60"
                    value={breakfastBreakDuration}
                    onChange={(e) => setBreakfastBreakDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required={hasBreakfastBreak}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="lunchBreakDuration">
                Lunch Break Duration (minutes)
                <span className="ml-1 text-xs text-gray-500">(Length of lunch period)</span>
              </label>
              <input
                id="lunchBreakDuration"
                type="number"
                min="0"
                max="120"
                value={lunchBreakDuration}
                onChange={(e) => setLunchBreakDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="lunchBreakStartTime">
                Lunch Break Start Time
                <span className="ml-1 text-xs text-gray-500">(When lunch period begins)</span>
              </label>
              <input
                id="lunchBreakStartTime"
                type="time"
                value={lunchBreakStartTime}
                onChange={(e) => setLunchBreakStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="lessonsPerDay">
                Lessons Per Day
                <span className="ml-1 text-xs text-gray-500">(Maximum number of lessons in a day)</span>
              </label>
              <input
                id="lessonsPerDay"
                type="number"
                min="1"
                max="12"
                value={lessonsPerDay}
                onChange={(e) => setLessonsPerDay(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="daysPerWeek">
                Days Per Week
                <span className="ml-1 text-xs text-gray-500">(Number of school days in a week)</span>
              </label>
              <input
                id="daysPerWeek"
                type="number"
                min="1"
                max="7"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Working Days
              <span className="ml-1 text-xs text-gray-500">(Select which days of the week classes are held)</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {daysOfWeek.map((day) => (
                <label key={day.value} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={workingDays.includes(day.value)}
                    onChange={() => handleWorkingDayChange(day.value)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6 bg-yellow-50 p-4 rounded border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">Room Assignment Settings</h3>
            <p className="text-sm text-yellow-700 mb-4">
              In some schools (like many Ghanaian schools), students stay in one classroom and teachers move between rooms.
              You can disable room constraints if your school follows this model.
            </p>

            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={useRoomConstraints}
                  onChange={(e) => setUseRoomConstraints(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700 font-medium">Use room constraints in scheduling</span>
              </label>
              <p className="mt-1 text-sm text-gray-600 ml-7">
                {useRoomConstraints
                  ? "Room assignments will be considered when generating schedules."
                  : "Room assignments will be ignored when generating schedules. Teachers will move between classrooms."}
              </p>
            </div>
          </div>

          <div className="mb-6 bg-indigo-50 p-4 rounded border border-indigo-200">
            <h3 className="font-semibold text-indigo-800 mb-2">Advanced Scheduling Constraints</h3>
            <p className="text-sm text-indigo-700 mb-4">
              These settings provide finer control over how classes are scheduled. Leave blank to use default behavior.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="minSubjectsPerDay">
                  Minimum Subjects Per Day
                  <span className="ml-1 text-xs text-gray-500">(Minimum unique subjects each day)</span>
                </label>
                <input
                  id="minSubjectsPerDay"
                  type="number"
                  min="1"
                  max={lessonsPerDay}
                  value={minSubjectsPerDay === undefined ? '' : minSubjectsPerDay}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setMinSubjectsPerDay(val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ensures each class has at least this many different subjects each day.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="exactLessonsPerDay">
                  Exact Lessons Per Day
                  <span className="ml-1 text-xs text-gray-500">(Enforce exact number of lessons)</span>
                </label>
                <input
                  id="exactLessonsPerDay"
                  type="number"
                  min="1"
                  max={lessonsPerDay}
                  value={exactLessonsPerDay === undefined ? '' : exactLessonsPerDay}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setExactLessonsPerDay(val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Forces each class to have exactly this many lessons each day (if possible).
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="minFreeDaysPerWeek">
                  Minimum Free Days Per Week
                  <span className="ml-1 text-xs text-gray-500">(Days with no lessons)</span>
                </label>
                <input
                  id="minFreeDaysPerWeek"
                  type="number"
                  min="0"
                  max={daysPerWeek - 1}
                  value={minFreeDaysPerWeek === undefined ? '' : minFreeDaysPerWeek}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setMinFreeDaysPerWeek(val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ensures each class has at least this many days per week with no scheduled lessons.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Preview of Generated Time Slots</h3>
            <p className="text-sm text-gray-600 mb-4">This is how your school day will be structured based on the settings above.</p>

            <div className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {generateTimeSlots().map((slot, index) => (
                    <tr key={index} className={
                      slot.type === 'lesson' ? 'bg-white' :
                      slot.type === 'break' ? 'bg-gray-100' :
                      slot.type === 'breakfast' ? 'bg-blue-50' : 'bg-yellow-50'
                    }>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {slot.slotNumber !== null ? `Lesson ${slot.slotNumber}` : ''}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{slot.startTime}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{slot.endTime}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {slot.type === 'lesson' ? 'Lesson' :
                         slot.type === 'break' ? 'Break' :
                         slot.type === 'breakfast' ? 'Breakfast Break' : 'Lunch Break'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard/schedules')}
              className="px-4 py-2 border border-gray-300 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
