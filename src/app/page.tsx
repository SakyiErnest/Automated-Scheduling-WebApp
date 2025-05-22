'use client';

import Link from "next/link";
// Import icons from Heroicons
import {
    ClockIcon,
    Cog8ToothIcon,
    ChartBarSquareIcon,
    ShieldCheckIcon,
    AcademicCapIcon,
    SparklesIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

// For Solid icons on buttons and special elements
import { ArrowRightIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

// For animations
import { motion } from '@/lib/framer-motion';

export default function Home() {
    const features = [
        {
            name: "Intelligent Scheduling",
            description:
                "Our advanced algorithm finds optimal, conflict-free schedules in minutes, saving hours of manual work.",
            icon: SparklesIcon,
        },
        {
            name: "Flexible Constraints",
            description:
                "Define custom rules for teacher availability, room suitability, and workload limits with ease.",
            icon: Cog8ToothIcon,
        },
        {
            name: "Real-time Updates",
            description:
                "Changes are instantly reflected, keeping everyone informed and on the same page.",
            icon: ChartBarSquareIcon,
        },
        {
            name: "Role-Based Access",
            description:
                "Ensure data security with appropriate access levels for administrators, teachers, and staff.",
            icon: ShieldCheckIcon,
        },
        {
            name: "Institution Support",
            description:
                "Get responsive support tailored specifically for educational institutions.",
            icon: AcademicCapIcon,
        },
        {
            name: "Visual Timetables",
            description:
                "Intuitive visual interfaces make complex schedules easy to understand and manage.",
            icon: ClockIcon,
        },
    ];

    const testimonials = [
        {
            quote: "This scheduler cut our planning time by 80%! The ability to handle complex constraints is incredible.",
            name: "Dr. Evelyn Reed",
            title: "Principal, Oakwood High",
        },
        {
            quote: "Finally, a tool that understands the nuances of university timetabling. Implementation was smooth, and support is top-notch.",
            name: "Mr. Samuel Chen",
            title: "Registrar, Lakeside University",
        },
        {
            quote: "Reduced conflicts to zero and improved our resource utilization significantly. Highly recommended!",
            name: "Aisha Khan",
            title: "Admin Head, Bright Star Academy",
        }
    ];

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

    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-800">
            {/* Hero Section - Clean, modern design with subtle accent */}
            <header className="bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
                {/* Abstract shapes - Adjusted for smaller screens */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-64 h-64 md:-top-48 md:-right-48 md:w-96 md:h-96 rounded-full bg-indigo-100/40"></div>
                    <div className="absolute top-1/4 -left-16 w-48 h-48 md:top-1/3 md:-left-24 md:w-64 md:h-64 rounded-full bg-blue-100/30"></div>
                </div>

                <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl">
                    {/* Navigation - Adjusted padding and spacing */}
                    <nav className="flex flex-col sm:flex-row justify-between items-center mb-12 md:mb-20">
                        <Link href="/" className="text-xl md:text-2xl font-bold text-indigo-600 flex items-center mb-4 sm:mb-0">
                            <CalendarDaysIcon className="h-7 w-7 md:h-8 md:w-8 mr-2 text-indigo-500" />
                            <span>Schedul<span className="text-indigo-500">Easy</span></span>
                        </Link>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <Link
                                href="/login"
                                className="px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs sm:text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/register"
                                className="px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs sm:text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm"
                            >
                                Get Started
                            </Link>
                        </div>
                    </nav>

                    {/* Hero Content - Adjusted text size, padding, and layout */}
                    <motion.div
                        className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-center md:text-left py-6 md:py-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="md:w-1/2 lg:w-3/5">
                            <motion.h1
                                className="text-3xl sm:text-4xl lg:text-6xl font-extrabold !leading-tight text-slate-900 mb-4 md:mb-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                            >
                                Smart Timetabling <br className="hidden md:inline"/> for Modern Education
                            </motion.h1>
                            <motion.p
                                className="text-base sm:text-lg lg:text-xl text-slate-600 mb-8 md:mb-10 max-w-2xl mx-auto md:mx-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                            >
                                Replace complex spreadsheets with intelligent automated scheduling. Create optimal, conflict-free timetables in minutes.
                            </motion.p>
                            <motion.div
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                            >
                                <Link
                                    href="/register"
                                    className="group px-5 py-2.5 md:px-6 md:py-3 bg-indigo-600 text-white rounded-md font-semibold text-sm md:text-base text-center hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    Start Free Trial
                                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="#features"
                                    className="px-5 py-2.5 md:px-6 md:py-3 border border-slate-300 text-slate-700 rounded-md font-semibold text-sm md:text-base text-center hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Explore Features
                                </Link>
                            </motion.div>
                        </div>
                        <motion.div
                            className="md:w-1/2 lg:w-2/5 flex justify-center mt-8 md:mt-0"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            {/* Hero illustration - Adjusted size and padding */}
                            <div className="relative w-full max-w-sm md:max-w-md aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg overflow-hidden p-4 md:p-6 flex items-center justify-center">
                                <div className="grid grid-cols-7 grid-rows-5 gap-1 md:gap-2 w-full h-full opacity-90">
                                    <div className="col-span-3 row-span-2 bg-white rounded-lg shadow-sm p-1.5 md:p-2 flex flex-col">
                                        <div className="h-1.5 md:h-2 w-12 md:w-16 bg-indigo-200 rounded mb-1 md:mb-2"></div>
                                        <div className="flex-1 grid grid-cols-3 gap-1">
                                            <div className="bg-blue-100 rounded"></div>
                                            <div className="bg-indigo-100 rounded"></div>
                                            <div className="bg-purple-100 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="col-span-4 row-span-3 bg-white rounded-lg shadow-sm flex flex-col gap-1 md:gap-2 p-1.5 md:p-2 ml-1 md:ml-2">
                                        <div className="flex justify-between items-center">
                                            <div className="h-1.5 md:h-2 w-10 md:w-12 bg-slate-200 rounded"></div>
                                            <CalendarDaysIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-400" />
                                        </div>
                                        <div className="grid grid-cols-5 grid-rows-3 gap-0.5 md:gap-1 flex-1">
                                            {[...Array(15)].map((_, i) => (
                                                <div key={i} className={`rounded ${i % 3 === 0 ? 'bg-blue-100' : i % 3 === 1 ? 'bg-indigo-100' : 'bg-purple-100'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-2 row-span-3 bg-white rounded-lg shadow-sm p-1.5 md:p-2 flex items-center justify-center mr-1 md:mr-2">
                                        <ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
                                    </div>
                                    <div className="col-span-5 row-span-2 bg-white rounded-lg shadow-sm p-1.5 md:p-2 flex flex-col justify-center mt-1 md:mt-2">
                                        <div className="h-1.5 md:h-2 w-full bg-purple-200 rounded mb-1 md:mb-2"></div>
                                        <div className="h-1.5 md:h-2 w-4/5 bg-purple-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </header>

            <main className="flex-grow">
                {/* Features Section - Adjusted grid columns and padding */}
                <section id="features" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                        <motion.div
                            className="text-center mb-12 md:mb-16"
                            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
                            variants={itemVariants}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose SchedulEasy?</h2>
                            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Everything you need to streamline your institution's scheduling process.</p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                        >
                            {features.map((feature) => (
                                <motion.div
                                    key={feature.name}
                                    className="bg-slate-50/50 p-6 rounded-lg border border-slate-200/70 hover:shadow-md transition-shadow duration-300"
                                    variants={itemVariants}
                                >
                                    <feature.icon className="h-10 w-10 text-indigo-500 mb-4" aria-hidden="true" />
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{feature.name}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* How It Works Section - Adjusted padding */}
                <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
                    <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                        <motion.div
                            className="text-center mb-12 md:mb-16"
                            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
                            variants={itemVariants}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple Steps to a Perfect Schedule</h2>
                            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Get started quickly with our intuitive process.</p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                        >
                            <motion.div variants={itemVariants} className="flex flex-col items-center">
                                <div className="bg-indigo-100 rounded-full p-4 mb-4">
                                    <BuildingOffice2Icon className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">1. Define Resources</h3>
                                <p className="text-slate-600 text-sm">Input teachers, subjects, rooms, and availability constraints.</p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="flex flex-col items-center">
                                <div className="bg-blue-100 rounded-full p-4 mb-4">
                                    <Cog8ToothIcon className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">2. Set Rules</h3>
                                <p className="text-slate-600 text-sm">Specify preferences like maximum consecutive classes or preferred times.</p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="flex flex-col items-center">
                                <div className="bg-purple-100 rounded-full p-4 mb-4">
                                    <SparklesIcon className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">3. Generate & Refine</h3>
                                <p className="text-slate-600 text-sm">Let the algorithm work its magic, then easily make manual adjustments.</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Testimonials Section - Adjusted padding and layout */}
                <section className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
                        <motion.div
                            className="text-center mb-12 md:mb-16"
                            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
                            variants={itemVariants}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Trusted by Educators</h2>
                            <p className="text-lg text-slate-600">See how SchedulEasy transforms timetabling for institutions like yours.</p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-slate-50/50 p-6 rounded-lg border border-slate-200/70 flex flex-col"
                                    variants={itemVariants}
                                >
                                    <blockquote className="text-slate-700 italic mb-4 flex-grow">“{testimonial.quote}”</blockquote>
                                    <footer className="mt-auto">
                                        <p className="font-semibold text-slate-800">{testimonial.name}</p>
                                        <p className="text-sm text-indigo-600">{testimonial.title}</p>
                                    </footer>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section - Adjusted padding */}
                <section className="py-16 md:py-24 bg-gradient-to-tr from-indigo-50 to-blue-50">
                    <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center">
                        <motion.div
                            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
                            variants={itemVariants}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Ready to Simplify Your Scheduling?</h2>
                            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">Join hundreds of institutions saving time and reducing stress with automated timetabling.</p>
                            <Link
                                href="/register"
                                className="group inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold text-center hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg"
                            >
                                Get Started for Free
                                <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Footer - Adjusted padding */}
            <footer className="py-8 bg-slate-100 border-t border-slate-200">
                <div className="container mx-auto px-4 sm:px-6 max-w-7xl text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} SchedulEasy. All rights reserved.</p>
                    <div className="mt-2">
                        <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
                        <span className="mx-2">|</span>
                        <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}