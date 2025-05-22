// Common types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

// School related types
export interface School extends BaseEntity {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  userId: string; // Owner of the school
}

export interface SchoolSettings extends BaseEntity {
  schoolId: string;
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
  lessonDuration: number; // In minutes
  breakDuration: number; // In minutes

  // Breakfast break settings
  hasBreakfastBreak: boolean; // Whether to include a breakfast break
  breakfastBreakStartTime: string; // Format: "HH:MM" (24-hour)
  breakfastBreakDuration: number; // In minutes

  lunchBreakDuration: number; // In minutes
  lunchBreakStartTime: string; // Format: "HH:MM" (24-hour)
  lessonsPerDay: number;
  daysPerWeek: number;
  workingDays: string[]; // e.g., ["MONDAY", "TUESDAY", ...]

  // Room constraint settings
  useRoomConstraints: boolean; // Whether to consider room assignments in scheduling

  // Advanced scheduling constraints
  minSubjectsPerDay?: number; // Minimum number of unique subjects per day
  exactLessonsPerDay?: number; // Exact number of lessons per day (if specified)
  minFreeDaysPerWeek?: number; // Minimum number of days per week with no lessons
}

// Teacher related types
export interface Teacher extends BaseEntity {
  schoolId: string;
  name: string;
  email?: string;
  phone?: string;
  subjects: string[]; // Array of subject IDs
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  availability?: TeacherAvailability[];
}

export interface TeacherAvailability {
  day: string; // e.g., "MONDAY"
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
}

// Class related types
export interface Class extends BaseEntity {
  schoolId: string;
  name: string;
  grade?: string;
  section?: string;
  requiredSubjects: string[]; // Array of subject IDs
  students?: number; // Number of students
}

// Subject related types
export interface Subject extends BaseEntity {
  schoolId: string;
  name: string;
  code?: string;
  hoursPerWeek: number;
  description?: string;
  color?: string; // For UI display
}

// Room related types
export interface Room extends BaseEntity {
  schoolId: string;
  name: string;
  capacity: number;
  building?: string;
  floor?: string;
  roomNumber?: string;
  features?: string[]; // e.g., ["PROJECTOR", "WHITEBOARD", ...]
}

// Schedule related types
export interface Schedule extends BaseEntity {
  schoolId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'published' | 'archived';
  entries: ScheduleEntry[];
}

export interface ScheduleEntry {
  id: string;
  day: string; // e.g., "MONDAY"
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  roomName?: string; // Optional room name (used when room constraints are disabled)
  isBreak?: boolean; // Whether this entry is a break (breakfast or lunch)
  breakType?: 'breakfast' | 'lunch'; // Type of break
}

// User related types
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
}

// API related types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

// Scheduling algorithm input types
export interface ScheduleGenerationInput {
  school_settings: {
    startTime: string;
    endTime: string;
    lessonDuration: number;
    breakDuration: number;

    // Breakfast break settings
    hasBreakfastBreak: boolean;
    breakfastBreakStartTime: string;
    breakfastBreakDuration: number;

    lunchBreakDuration: number;
    lunchBreakStartTime: string;
    lessonsPerDay: number;
    daysPerWeek: number;
    workingDays?: string[];

    // Room constraint settings
    useRoomConstraints: boolean;

    // Advanced scheduling constraints
    minSubjectsPerDay?: number;
    exactLessonsPerDay?: number;
    minFreeDaysPerWeek?: number;
  };
  teachers: {
    id: string;
    name: string;
    subjects: string[];
    maxHoursPerDay: number;
    maxHoursPerWeek: number;
    availability?: TeacherAvailability[];
  }[];
  classes: {
    id: string;
    name: string;
    requiredSubjects: string[];
  }[];
  subjects: {
    id: string;
    name: string;
    hoursPerWeek: number;
  }[];
  rooms: {
    id: string;
    name: string;
    capacity: number;
  }[];
}

export interface ScheduleGenerationOutput {
  scheduleId: string;
  entries: ScheduleEntry[];
}
