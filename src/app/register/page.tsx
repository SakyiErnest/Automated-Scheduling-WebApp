'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import Image for logo
import { useAuth } from '@/contexts/AuthContext'; // Assuming correct path

// Icons
import { FcGoogle } from 'react-icons/fc';
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Simple spinner
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Simple Spinner Component (reuse from login or define here)
const Spinner = () => (
    <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
);

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Track which button triggered loading for spinner placement
    const [loadingProvider, setLoadingProvider] = useState<'email' | 'google' | null>(null);
    const router = useRouter();
    const { signup, loginWithGoogle } = useAuth(); // Make sure useAuth provides signup

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError(''); // Clear previous errors

        // Password Match Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        // Optional: Add password strength validation here

        setLoading(true);
        setLoadingProvider('email');

        try {
            await signup(email, password, name); // Pass name to signup function
            router.push('/dashboard'); // Redirect on successful signup
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
            setLoading(false); // Only stop loading on error
            setLoadingProvider(null);
        }
        // No finally setLoading(false) here for the success case
    };

    const handleGoogleLogin = async () => {
         if (loading) return;

        setError('');
        setLoading(true);
        setLoadingProvider('google');

        try {
            // Assuming loginWithGoogle handles both login and signup flows
            await loginWithGoogle();
            router.push('/dashboard');
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to sign up with Google. Please try again.');
            setLoading(false);
            setLoadingProvider(null);
        }
        // No finally setLoading(false) here for the success case
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            {/* Card Container */}
            <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-xl shadow-lg space-y-8 border border-slate-200">
                {/* Logo and Header */}
                <div>
                     {/* Optional Logo - Replace with your path */}
                     <Link href="/" className="flex justify-center mb-6">
                         <Image
                             src="/logo.png" // CHANGE THIS PATH
                             alt="SchedulEasy Logo" // Update Alt Text
                             width={48}
                             height={48}
                             className="h-12 w-auto"
                         />
                     </Link>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
                        Create your SchedulEasy account
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>

                 {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md relative text-sm" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* Registration Form */}
                <form className="space-y-5" onSubmit={handleRegister}>
                    {/* Name Input */}
                    <div className="relative">
                         <label htmlFor="name" className="sr-only">Full Name</label>
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <UserIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                         </div>
                         <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            className="block w-full rounded-md border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                         <label htmlFor="email-address" className="sr-only">Email address</label>
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <EnvelopeIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                         </div>
                         <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                             className="block w-full rounded-md border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                     {/* Password Input */}
                     <div className="relative">
                         <label htmlFor="password" className="sr-only">Password</label>
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <LockClosedIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                         </div>
                         <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                             // Optional: Add pattern for password strength
                             // pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                             // title="Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters"
                             className={`block w-full rounded-md border-slate-300 py-2.5 pl-10 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition ${
                                 error && error.includes('Password') ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : '' // Example error styling
                             }`}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                         <button
                             type="button"
                             onClick={() => setShowPassword(!showPassword)}
                             className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                             aria-label={showPassword ? "Hide password" : "Show password"}
                         >
                             {showPassword ? (
                                 <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                             ) : (
                                 <EyeIcon className="h-5 w-5" aria-hidden="true" />
                             )}
                         </button>
                    </div>

                     {/* Confirm Password Input */}
                     <div className="relative">
                         <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <LockClosedIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                         </div>
                         <input
                            id="confirm-password"
                            name="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                             className={`block w-full rounded-md border-slate-300 py-2.5 pl-10 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition ${
                                 error === 'Passwords do not match' ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''
                             }`}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                         <button
                             type="button"
                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                             className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                             aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                         >
                             {showConfirmPassword ? (
                                 <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                             ) : (
                                 <EyeIcon className="h-5 w-5" aria-hidden="true" />
                             )}
                         </button>
                    </div>

                     {/* Submit Buttons & Divider */}
                    <div className="space-y-4 pt-3">
                         {/* Email Sign Up Button */}
                        <button
                            type="submit"
                            disabled={loading}
                             className={`group relative w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-white ${
                                 loading
                                     ? 'bg-indigo-400 cursor-not-allowed'
                                     : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
                             }`}
                        >
                             {loading && loadingProvider === 'email' ? (
                                <Spinner />
                             ) : (
                                'Create account'
                             )}
                        </button>

                        {/* OR Divider */}
                        <div className="relative">
                             <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                 <div className="w-full border-t border-slate-300" />
                             </div>
                             <div className="relative flex justify-center text-sm">
                                 <span className="bg-white px-2 text-slate-500">OR</span>
                             </div>
                        </div>

                        {/* Google Sign Up Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`group relative w-full flex justify-center items-center py-2.5 px-4 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                                 loading
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                        >
                             {loading && loadingProvider === 'google' ? (
                                <Spinner />
                            ) : (
                                <>
                                    <FcGoogle className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Continue with Google
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}