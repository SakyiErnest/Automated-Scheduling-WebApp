'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from '@/lib/framer-motion';

// Heroicons
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  UsersIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const sidebarItems = [
  { name: 'Dashboard', icon: HomeIcon, href: '/dashboard' },
  { name: 'Schools', icon: AcademicCapIcon, href: '/dashboard/schools' },
  { name: 'Teachers', icon: UsersIcon, href: '/dashboard/teachers' },
  { name: 'Classes', icon: UserGroupIcon, href: '/dashboard/classes' },
  { name: 'Subjects', icon: BookOpenIcon, href: '/dashboard/subjects' },
  { name: 'Rooms', icon: BuildingOfficeIcon, href: '/dashboard/rooms' },
  { name: 'Schedules', icon: CalendarDaysIcon, href: '/dashboard/schedules' },
  { name: 'Settings', icon: Cog6ToothIcon, href: '/dashboard/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('/dashboard');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }

    // Set the active item based on the current path
    const pathName = window.location.pathname;
    const matchingItem = sidebarItems.find(item =>
      pathName === item.href || pathName.startsWith(item.href + '/')
    );

    if (matchingItem) {
      setActiveItem(matchingItem.href);
    }
  }, [currentUser, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative flex flex-col items-center">
          <div className="absolute animate-ping h-12 w-12 rounded-full bg-indigo-400 opacity-75"></div>
          <div className="relative animate-pulse h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
            <CalendarDaysIcon className="h-6 w-6 text-white" />
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: "-100%", opacity: 0.5 },
  };

  const itemVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -10 },
  };

  const contentVariants = {
    wide: { marginLeft: "0" },
    narrow: { marginLeft: "0" },
    standard: { marginLeft: "16rem" },
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  const userInitials = currentUser?.displayName
    ? getInitials(currentUser.displayName)
    : currentUser?.email?.charAt(0).toUpperCase() || '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - Overlay for mobile when sidebar is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900 opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={isSidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30 overflow-y-auto scrollbar-thin"
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h2 className="text-xl font-bold text-slate-800">SchedulEasy</h2>
            </div>
            <button
              title="Close sidebar"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-full hover:bg-slate-100 md:hidden text-slate-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="mt-4 px-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeItem === item.href;
              return (
                <motion.div key={item.name} variants={itemVariants}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-3 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                    } transition-colors`}
                    onClick={() => {
                      setActiveItem(item.href);
                      if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                    }}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-500'
                      } transition-colors`}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="ml-auto">
                        <ChevronRightIcon className="h-4 w-4 text-indigo-600" />
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors text-slate-700 flex items-center justify-center text-sm font-medium"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2 text-slate-500" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.div
        animate={
          isSidebarOpen
            ? window.innerWidth < 768
              ? "wide"
              : "standard"
            : "wide"
        }
        variants={contentVariants}
        transition={{ duration: 0.3 }}
        className="md:ml-64 transition-all duration-300 ease-in-out"
      >
        {/* Top Navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="relative inline-block text-left">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <span className="hidden md:block text-sm font-medium text-slate-700">
                  {currentUser?.displayName || currentUser?.email}
                </span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {userInitials}
                </div>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-slate-200 divide-y divide-slate-100 focus:outline-none z-50"
                    onBlur={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm text-slate-900 font-medium">
                        {currentUser?.displayName || "User"}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {currentUser?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/profile"
                        className="text-slate-700 block px-4 py-2 text-sm hover:bg-slate-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="text-slate-700 block px-4 py-2 text-sm hover:bg-slate-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="text-slate-700 block w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 p-6 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} SchedulEasy. All rights reserved.</p>
        </footer>
      </motion.div>
    </div>
  );
}
