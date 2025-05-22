'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Schedule } from '@/types';
import { motion } from '@/lib/framer-motion';

// Import Heroicons
import {
  AcademicCapIcon,
  UsersIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  PlusIcon,
  ArrowRightIcon,
  ChartBarSquareIcon,
  ClockIcon,
  PlusCircleIcon,
  LightBulbIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    schools: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
    schedules: 0,
    rooms: 0,
  });
  const [recentSchedules, setRecentSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Get counts for user-specific data
        const schoolsSnapshot = await getDocs(
          query(collection(db, 'schools'), where('userId', '==', currentUser.uid))
        );

        // Get all school IDs for this user
        const schoolIds = schoolsSnapshot.docs.map(doc => doc.id);

        if (schoolIds.length === 0) {
          setStats({
            schools: 0,
            teachers: 0,
            classes: 0,
            subjects: 0,
            schedules: 0,
            rooms: 0,
          });
          setLoading(false);
          return;
        }

        // Use those school IDs to query related collections
        const teachersPromises = schoolIds.map(schoolId =>
          getDocs(query(collection(db, 'teachers'), where('schoolId', '==', schoolId)))
        );

        const classesPromises = schoolIds.map(schoolId =>
          getDocs(query(collection(db, 'classes'), where('schoolId', '==', schoolId)))
        );

        const subjectsPromises = schoolIds.map(schoolId =>
          getDocs(query(collection(db, 'subjects'), where('schoolId', '==', schoolId)))
        );

        const schedulesPromises = schoolIds.map(schoolId =>
          getDocs(query(collection(db, 'schedules'), where('schoolId', '==', schoolId)))
        );

        const roomsPromises = schoolIds.map(schoolId =>
          getDocs(query(collection(db, 'rooms'), where('schoolId', '==', schoolId)))
        );

        // Wait for all queries to complete
        const [teachersResults, classesResults, subjectsResults, schedulesResults, roomsResults] = await Promise.all([
          Promise.all(teachersPromises),
          Promise.all(classesPromises),
          Promise.all(subjectsPromises),
          Promise.all(schedulesPromises),
          Promise.all(roomsPromises),
        ]);

        // Count total documents across all schools
        const teachersCount = teachersResults.reduce((total, snapshot) => total + snapshot.size, 0);
        const classesCount = classesResults.reduce((total, snapshot) => total + snapshot.size, 0);
        const subjectsCount = subjectsResults.reduce((total, snapshot) => total + snapshot.size, 0);
        const schedulesCount = schedulesResults.reduce((total, snapshot) => total + snapshot.size, 0);
        const roomsCount = roomsResults.reduce((total, snapshot) => total + snapshot.size, 0);

        // Get recent schedules
        const allSchedules: Schedule[] = [];
        schedulesResults.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            const scheduleData = doc.data();
            allSchedules.push({
              ...scheduleData,
              id: doc.id,
              createdAt: scheduleData.createdAt?.toDate?.()
                ? scheduleData.createdAt.toDate().toISOString()
                : scheduleData.createdAt || new Date().toISOString(),
            } as Schedule);
          });
        });

        // Sort by creation date and take the 5 most recent
        const sortedSchedules = allSchedules.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 5);

        setRecentSchedules(sortedSchedules);

        setStats({
          schools: schoolsSnapshot.size,
          teachers: teachersCount,
          classes: classesCount,
          subjects: subjectsCount,
          schedules: schedulesCount,
          rooms: roomsCount,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } }
  };

  const statItems = [
    { name: 'Schools', count: stats.schools, icon: AcademicCapIcon, href: '/dashboard/schools', color: 'indigo' },
    { name: 'Teachers', count: stats.teachers, icon: UsersIcon, href: '/dashboard/teachers', color: 'blue' },
    { name: 'Classes', count: stats.classes, icon: UserGroupIcon, href: '/dashboard/classes', color: 'cyan' },
    { name: 'Subjects', count: stats.subjects, icon: BookOpenIcon, href: '/dashboard/subjects', color: 'green' },
    { name: 'Rooms', count: stats.rooms, icon: BuildingOfficeIcon, href: '/dashboard/rooms', color: 'amber' },
    { name: 'Schedules', count: stats.schedules, icon: CalendarDaysIcon, href: '/dashboard/schedules', color: 'rose' },
  ];

  const quickActions = [
    {
      name: 'Create Schedule',
      description: 'Generate a new timetable',
      href: '/dashboard/schedules/new',
      icon: CalendarDaysIcon,
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      name: 'Add Teacher',
      description: 'Register a new teacher',
      href: '/dashboard/teachers/new',
      icon: UsersIcon,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Add Class',
      description: 'Create a new class',
      href: '/dashboard/classes/new',
      icon: UserGroupIcon,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Add Room',
      description: 'Register a new room',
      href: '/dashboard/rooms/new',
      icon: BuildingOfficeIcon,
      color: 'bg-amber-600 hover:bg-amber-700'
    },
  ];

  const getStepIcon = (step: number) => {
    switch(step) {
      case 1: return AcademicCapIcon;
      case 2: return UsersIcon;
      case 3: return UserGroupIcon;
      case 4: return BuildingOfficeIcon;
      case 5: return CalendarDaysIcon;
      default: return LightBulbIcon;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back, {currentUser?.displayName || 'User'}! Here's an overview of your scheduling system.
          </p>
        </motion.div>

        <motion.div
          className="mt-4 md:mt-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Link
            href="/dashboard/schedules/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            <PlusIcon className="h-5 w-5 mr-1.5" />
            Create New Schedule
          </Link>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="absolute animate-ping h-12 w-12 rounded-full bg-indigo-400 opacity-75"></div>
            <div className="relative animate-pulse h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {statItems.map((item) => (
              <motion.div
                key={item.name}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
                variants={itemVariants}
                onClick={() => window.location.href = item.href}
              >
                <div className={`h-10 w-10 rounded-lg bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 mb-3`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">{item.name}</p>
                <h3 className="text-3xl font-bold text-slate-900">{item.count}</h3>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Schedules */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="font-semibold text-slate-900">Recent Schedules</h3>
                </div>
                <Link href="/dashboard/schedules" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
                  View all
                  <ArrowRightIcon className="h-3 w-3 ml-1" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {recentSchedules.length > 0 ? (
                  recentSchedules.map((schedule, index) => (
                    <Link href={`/dashboard/schedules/${schedule.id}`} key={schedule.id} className="block hover:bg-slate-50 transition-colors">
                      <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-start">
                          <span className="h-8 w-8 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 mt-0.5">
                            <CalendarDaysIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <h4 className="font-medium text-slate-900">
                              {schedule.name || `Schedule ${new Date(schedule.createdAt).toLocaleDateString()}`}
                            </h4>
                            <div className="flex items-center mt-1">
                              <ClockIcon className="h-3.5 w-3.5 text-slate-400 mr-1" />
                              <p className="text-xs text-slate-500">
                                Created {new Date(schedule.createdAt).toLocaleDateString()} at {new Date(schedule.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <ChartBarSquareIcon className="h-5 w-5 text-slate-400" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <CalendarDaysIcon className="h-6 w-6" />
                    </div>
                    <h4 className="text-slate-700 font-medium mb-1">No schedules yet</h4>
                    <p className="text-slate-500 text-sm mb-4">
                      Create your first schedule to get started
                    </p>
                    <Link
                      href="/dashboard/schedules/new"
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Create Schedule
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center">
                  <BoltIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <h3 className="font-semibold text-slate-900">Quick Actions</h3>
                </div>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {quickActions.map((action) => (
                    <Link
                      key={action.name}
                      href={action.href}
                      className={`${action.color} text-white rounded-lg p-4 hover:shadow-md transition-all`}
                    >
                      <div className="flex items-center">
                        <div className="bg-white/20 rounded-md p-2 mr-4">
                          <action.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium">{action.name}</h4>
                          <p className="text-xs text-white/80">{action.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Getting Started */}
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
                <LightBulbIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Getting Started</h3>
            </div>

            <div className="grid md:grid-cols-5 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5].map((step) => {
                const StepIcon = getStepIcon(step);
                const steps = [
                  "Add your school details",
                  "Register teachers and availability",
                  "Set up classes and subjects",
                  "Configure rooms and features",
                  "Generate and manage schedules"
                ];

                const links = [
                  "/dashboard/schools",
                  "/dashboard/teachers",
                  "/dashboard/classes",
                  "/dashboard/rooms",
                  "/dashboard/schedules"
                ];

                return (
                  <div
                    key={step}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-all duration-300"></div>
                    <Link
                      href={links[step-1]}
                      className="relative block bg-white rounded-lg p-4 ring-1 ring-slate-100 hover:ring-indigo-100 transition-all"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                          <StepIcon className="h-6 w-6" />
                        </div>
                        <div className="font-bold text-2xl text-indigo-600 mb-1">{step}</div>
                        <p className="text-slate-600 text-sm">{steps[step-1]}</p>
                      </div>
                    </Link>

                    {step < 5 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <ArrowRightIcon className="h-5 w-5 text-indigo-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activity - Extra section */}
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 mr-3">
                  <FireIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Pro Tips</h3>
              </div>
            </div>

            <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-100">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <LightBulbIcon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-indigo-900 mb-1">Optimization Tip</h4>
                  <p className="text-sm text-indigo-700 mb-3">
                    Start by defining teacher constraints and availability before generating schedules.
                    This allows our algorithm to create more balanced timetables while respecting faculty preferences.
                  </p>
                  <Link
                    href="/dashboard/teachers"
                    className="inline-flex items-center text-xs font-medium text-indigo-700 hover:text-indigo-800"
                  >
                    Configure teacher availability
                    <ArrowRightIcon className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
