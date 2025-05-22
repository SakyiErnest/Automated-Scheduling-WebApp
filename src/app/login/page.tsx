'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from '@/lib/framer-motion';

// Heroicons
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CalendarDaysIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

import { ArrowRightIcon } from '@heroicons/react/24/solid';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<'email' | 'google' | null>(null);
    const router = useRouter();
    const { login, loginWithGoogle } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError('');
        setLoading(true);
        setLoadingProvider('email');

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to sign in. Please check your credentials.');
            setLoading(false);
            setLoadingProvider(null);
        }
    };

    const handleGoogleLogin = async () => {
        if (loading) return;

        setError('');
        setLoading(true);
        setLoadingProvider('google');

        try {
            await loginWithGoogle();
            router.push('/dashboard');
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to sign in with Google. Please try again.');
            setLoading(false);
            setLoadingProvider(null);
        }
    };

    return (
        <div className="min-h-screen grid md:grid-cols-2">
            {/* Left panel - Decorative */}
            <div className="hidden md:block bg-gradient-to-br from-indigo-600 to-blue-700 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-white/10 blur-xl"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center"
                        >
                            <CalendarDaysIcon className="h-8 w-8 text-white mr-2" />
                            <h1 className="text-2xl font-bold text-white">SchedulEasy</h1>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Smart scheduling for <br className="hidden md:block" />
                            <span className="text-indigo-200">smart educators</span>
                        </h2>
                        <p className="text-indigo-100 text-lg max-w-md">
                            The intelligent timetabling solution that helps you create optimal schedules in minutes, not days.
                        </p>

                        <div className="mt-12">
                            <div className="flex items-start space-x-3 mb-4">
                                <div className="h-6 w-6 rounded-full bg-indigo-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-indigo-100">Create conflict-free schedules automatically</p>
                            </div>
                            <div className="flex items-start space-x-3 mb-4">
                                <div className="h-6 w-6 rounded-full bg-indigo-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-indigo-100">Respect teacher preferences and constraints</p>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="h-6 w-6 rounded-full bg-indigo-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-indigo-100">Optimize room and resource utilization</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="text-indigo-200 flex items-center mt-24">
                        <Link href="/" className="flex items-center text-sm hover:text-white transition-colors">
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right panel - Login form */}
            <div className="flex items-center justify-center p-6 md:p-12 bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div>
                        {/* Mobile-only logo */}
                        <div className="md:hidden flex justify-center mb-6">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg">
                                <CalendarDaysIcon className="h-8 w-8 text-white" />
                            </div>
                        </div>

                        <h2 className="text-center text-3xl font-bold text-slate-900">Welcome back</h2>
                        <p className="mt-3 text-center text-slate-500">
                            Sign in to continue to your dashboard
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md text-sm"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Login form */}
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                        Password
                                    </label>
                                    <Link href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                                Remember me for 30 days
                            </label>
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`group relative w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                    loading && loadingProvider === 'email'
                                        ? 'bg-indigo-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                } transition-colors`}
                            >
                                {loading && loadingProvider === 'email' ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <div className="flex items-center">
                                        Sign in
                                        <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                )}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-700 ${
                                    loading && loadingProvider === 'google'
                                        ? 'cursor-not-allowed opacity-60'
                                        : 'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                } transition-colors`}
                            >
                                {loading && loadingProvider === 'google' ? (
                                    <svg className="animate-spin h-5 w-5 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Google
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-8">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}