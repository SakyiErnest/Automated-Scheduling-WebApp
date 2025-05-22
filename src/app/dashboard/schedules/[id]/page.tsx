'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSchool } from '@/contexts/SchoolContext';
import { schedulesCollection, teachersCollection, classesCollection, subjectsCollection, roomsCollection, schoolSettingsCollection } from '@/lib/firestore';
import { Schedule, Teacher, Class, Subject, Room, ScheduleEntry, SchoolSettings } from '@/types';
import { schedulerApi } from '@/lib/api';

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentSchool } = useSchool();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'room'>('class');
  const [useRoomConstraints, setUseRoomConstraints] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Days of the week
  const daysOfWeek = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' },
  ];

  // Fetch schedule and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentSchool || !scheduleId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch schedule
        const fetchedSchedule = await schedulesCollection.get<Schedule>(scheduleId);
        if (!fetchedSchedule) {
          setError('Schedule not found');
          return;
        }
        setSchedule(fetchedSchedule);

        // Fetch related data
        const fetchedTeachers = await teachersCollection.getAll<Teacher>(currentSchool.id);
        const fetchedClasses = await classesCollection.getAll<Class>(currentSchool.id);
        const fetchedSubjects = await subjectsCollection.getAll<Subject>(currentSchool.id);
        const fetchedRooms = await roomsCollection.getAll<Room>(currentSchool.id);

        // Fetch school settings to check if room constraints are enabled
        const schoolSettings = await schoolSettingsCollection.get<SchoolSettings>(currentSchool.id);
        if (schoolSettings && schoolSettings.useRoomConstraints !== undefined) {
          setUseRoomConstraints(schoolSettings.useRoomConstraints);

          // If room constraints are disabled, set the default view mode to 'class' or 'teacher'
          if (!schoolSettings.useRoomConstraints && viewMode === 'room') {
            setViewMode('class');
          }
        }

        setTeachers(fetchedTeachers);
        setClasses(fetchedClasses);
        setSubjects(fetchedSubjects);
        setRooms(fetchedRooms);

        // Set default selected item
        if (fetchedClasses.length > 0) {
          setSelectedItem(fetchedClasses[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load schedule. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentSchool, scheduleId]);

  // Handle publish schedule
  const handlePublish = async () => {
    if (!schedule) return;

    try {
      setLoading(true);
      await schedulesCollection.update<Schedule>(schedule.id, { status: 'published' });

      // Refresh schedule
      const updatedSchedule = await schedulesCollection.get<Schedule>(schedule.id);
      setSchedule(updatedSchedule);
    } catch (err) {
      console.error('Error publishing schedule:', err);
      setError('Failed to publish schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle archive schedule
  const handleArchive = async () => {
    if (!schedule) return;

    try {
      setLoading(true);
      await schedulesCollection.update<Schedule>(schedule.id, { status: 'archived' });

      // Refresh schedule
      const updatedSchedule = await schedulesCollection.get<Schedule>(schedule.id);
      setSchedule(updatedSchedule);
    } catch (err) {
      console.error('Error archiving schedule:', err);
      setError('Failed to archive schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle export to PDF
  const handleExportPdf = async () => {
    if (!schedule) return;

    try {
      setExporting(true);

      // Prepare export data
      const exportData = {
        schedule: schedule,
        classId: viewMode === 'class' ? selectedItem : undefined,
        includeBreaks: true
      };

      // Call API to export PDF
      const response = await schedulerApi.exportPdf(exportData);

      // Create a download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-${schedule.name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export schedule as PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Handle export to Excel
  const handleExportExcel = async () => {
    if (!schedule) return;

    try {
      setExporting(true);

      // Prepare export data
      const exportData = {
        schedule: schedule,
        classId: viewMode === 'class' ? selectedItem : undefined,
        includeBreaks: true
      };

      // Call API to export Excel
      const response = await schedulerApi.exportExcel(exportData);

      // Create a download link
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-${schedule.name.replace(/\s+/g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Failed to export schedule as Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Get name by ID
  const getTeacherName = (id: string) => {
    // Handle special break teacher ID
    if (id === 'break') return 'Break Time';

    const teacher = teachers.find(t => t.id === id);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const getClassName = (id: string) => {
    const classItem = classes.find(c => c.id === id);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const getSubjectName = (id: string) => {
    // Handle special break subject IDs
    if (id === 'breakfast-break') return 'Breakfast Break';
    if (id === 'lunch-break') return 'Lunch Break';

    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getRoomName = (id: string) => {
    const room = rooms.find(r => r.id === id);
    return room ? room.name : 'Unknown Room';
  };

  // Get subject color
  const getSubjectColor = (id: string) => {
    const subject = subjects.find(s => s.id === id);
    return subject?.color || '#3B82F6';
  };

  // Get subject color class
  const getSubjectColorClass = (id: string) => {
    // Handle special break subject IDs
    if (id === 'breakfast-break') return 'bg-blue-100 text-blue-800';
    if (id === 'lunch-break') return 'bg-yellow-100 text-yellow-800';

    const color = getSubjectColor(id);
    // Convert hex color to RGB for CSS variable
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

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

  // Filter entries based on view mode and selected item
  const getFilteredEntries = () => {
    if (!schedule || !schedule.entries) return [];

    if (!selectedItem) return schedule.entries;

    switch (viewMode) {
      case 'class':
        return schedule.entries.filter(entry => entry.classId === selectedItem);
      case 'teacher':
        return schedule.entries.filter(entry => entry.teacherId === selectedItem);
      case 'room':
        return schedule.entries.filter(entry => entry.roomId === selectedItem);
      default:
        return schedule.entries;
    }
  };

  // Group entries by day and sort by time
  const getGroupedEntries = () => {
    const entries = getFilteredEntries();
    const grouped: Record<string, ScheduleEntry[]> = {};

    // Initialize days
    daysOfWeek.forEach(day => {
      grouped[day.value] = [];
    });

    // Group entries by day
    entries.forEach(entry => {
      if (grouped[entry.day]) {
        grouped[entry.day].push(entry);
      } else {
        grouped[entry.day] = [entry];
      }
    });

    // Sort entries by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Schedule not found'}
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/schedules')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Back to Schedules
          </button>
        </div>
      </div>
    );
  }

  const groupedEntries = getGroupedEntries();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dynamic styles for subject colors */}
      <style dangerouslySetInnerHTML={{ __html: generateSubjectColorStyles() }} />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{schedule.name}</h1>
          <p className="text-gray-600">
            Status: <span className={`font-medium
              ${schedule.status === 'published' ? 'text-green-600' :
                schedule.status === 'archived' ? 'text-gray-600' :
                'text-yellow-600'}`}
            >
              {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
            </span>
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="space-x-2">
            {schedule.status === 'draft' && (
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Publish
              </button>
            )}
            {schedule.status === 'published' && (
              <button
                type="button"
                onClick={handleArchive}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Archive
              </button>
            )}
          </div>

          <div className="space-x-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>Export PDF</>
              )}
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>Export Excel</>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard/schedules')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <div>
            <label className="block text-gray-700 mb-2">View Mode</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setViewMode('class')}
                className={`px-4 py-2 rounded ${
                  viewMode === 'class'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition-colors`}
              >
                By Class
              </button>
              <button
                type="button"
                onClick={() => setViewMode('teacher')}
                className={`px-4 py-2 rounded ${
                  viewMode === 'teacher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition-colors`}
              >
                By Teacher
              </button>
              {useRoomConstraints && (
                <button
                  type="button"
                  onClick={() => setViewMode('room')}
                  className={`px-4 py-2 rounded ${
                    viewMode === 'room'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  } transition-colors`}
                >
                  By Room
                </button>
              )}
            </div>
          </div>

          <div className="flex-grow">
            <label htmlFor="schedule-item-selector" className="block text-gray-700 mb-2">
              {viewMode === 'class' ? 'Select Class' :
               viewMode === 'teacher' ? 'Select Teacher' : 'Select Room'}
            </label>
            <select
              id="schedule-item-selector"
              aria-label={viewMode === 'class' ? 'Select Class' :
                        viewMode === 'teacher' ? 'Select Teacher' : 'Select Room'}
              value={selectedItem || ''}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              {viewMode === 'class' && classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
              {viewMode === 'teacher' && teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
              {viewMode === 'room' && useRoomConstraints && rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7">
                  Time
                </th>
                {daysOfWeek.map(day => (
                  <th key={day.value} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Generate time slots */}
              {schedule.entries && schedule.entries.length > 0 && (
                Array.from(new Set(schedule.entries.map(entry => entry.startTime)))
                  .sort()
                  .map(timeSlot => (
                    <tr key={timeSlot}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {timeSlot} - {schedule.entries.find(entry => entry.startTime === timeSlot)?.endTime}
                      </td>
                      {daysOfWeek.map(day => {
                        const entry = groupedEntries[day.value]?.find(e => e.startTime === timeSlot);
                        return (
                          <td key={day.value} className="px-6 py-4">
                            {entry ? (
                              <div
                                className={`p-2 rounded text-sm ${
                                  entry.isBreak
                                    ? entry.breakType === 'breakfast'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : `text-white ${getSubjectColorClass(entry.subjectId)}`
                                }`}
                              >
                                <div className="font-medium">
                                  {entry.isBreak
                                    ? entry.breakType === 'breakfast'
                                      ? '🍳 Breakfast Break'
                                      : '🍽️ Lunch Break'
                                    : getSubjectName(entry.subjectId)
                                  }
                                </div>
                                {!entry.isBreak && (
                                  <div className="text-xs mt-1">
                                    {viewMode !== 'class' && (
                                      <div>{getClassName(entry.classId)}</div>
                                    )}
                                    {viewMode !== 'teacher' && (
                                      <div>{getTeacherName(entry.teacherId)}</div>
                                    )}
                                    {viewMode !== 'room' && useRoomConstraints && (
                                      <div>{getRoomName(entry.roomId)}</div>
                                    )}
                                    {!useRoomConstraints && entry.roomName && (
                                      <div className="italic text-xs">{entry.roomName}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
