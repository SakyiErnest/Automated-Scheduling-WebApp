# Automated Scheduling WebApp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://www.python.org/)
[![OR-Tools](https://img.shields.io/badge/OR--Tools-9.12+-orange)](https://developers.google.com/optimization)
[![Firebase](https://img.shields.io/badge/Firebase-11.6.0-yellow)](https://firebase.google.com/)

A comprehensive timetable scheduling system for educational institutions. This application helps schools, high schools, and university departments create conflict-free schedules based on their specific constraints and requirements, saving administrators countless hours of manual scheduling work.

## 🌟 Key Features

- **Automated Schedule Generation**: Leverages Google OR-Tools constraint programming to create optimal, conflict-free timetables
- **User Authentication**: Secure role-based access control for administrators, teachers, and staff
- **School Management**: Customize settings for multiple schools or departments
- **Resource Management**: Easily manage teachers, classes, subjects, and rooms
- **Multiple Schedule Views**: View schedules by class, teacher, or room
- **Schedule Publishing**: Create, review, publish, and archive schedules
- **Export Options**: Export schedules to PDF and Excel formats
- **Customizable Constraints**: Configure break times, subject distribution, and room assignments
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🖼️ Screenshots & Demo

<!-- Add screenshots or demo video embed here -->
<div align="center">
  <p><i>Screenshots coming soon! The application features a modern, aesthetic UI with intuitive navigation and comprehensive scheduling views.</i></p>
</div>

## 🔧 Technology Stack

### Frontend

- **Next.js & React**: Modern React framework with server-side rendering
- **TypeScript**: Type-safe JavaScript for robust code
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Framer Motion**: Smooth animations and transitions

### Backend

- **Firebase**: Authentication, Firestore database, and storage
- **Python Flask**: API server for the scheduling algorithm
- **OR-Tools**: Google's constraint programming solver
- **NumPy**: Scientific computing library for Python
- **ReportLab**: PDF generation library
- **XlsxWriter**: Excel file generation

## 📋 Project Structure

- `/src`: Frontend source code
  - `/app`: Next.js app router pages
  - `/components`: Reusable React components
  - `/contexts`: React context providers
  - `/lib`: Utility functions and API clients
  - `/types`: TypeScript type definitions
- `/scheduler-backend`: Python backend for the scheduling algorithm
  - `app.py`: Flask API server
  - `scheduler.py`: Constraint satisfaction algorithm using OR-Tools

## 🧠 Scheduling Algorithm

The timetable scheduling algorithm uses constraint programming to generate optimal schedules based on the following constraints:

### Hard Constraints

- No teacher can teach two classes simultaneously
- No class can have two subjects simultaneously
- No room can be used by two classes simultaneously
- Teachers can only teach subjects they are qualified for
- Classes must receive the required number of hours per subject
- Teachers cannot exceed their maximum hours per day/week

### Soft Constraints

- Minimize gaps in teacher schedules
- Distribute subjects evenly throughout the week
- Respect teacher availability preferences

The algorithm is implemented using Google's OR-Tools constraint solver, which provides efficient solutions for complex scheduling problems.

## 📋 Prerequisites

- Node.js (v18 or later)
- Python (v3.10 or later)
- Firebase account
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SakyiErnest/Automated-Scheduling-WebApp.git
cd Automated-Scheduling-WebApp
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd scheduler-backend
pip install -r requirements.txt
cd ..
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Start the Development Servers

```bash
npm run dev:all
```

This will start both the Next.js frontend and the Flask backend API.

### 6. Open in Browser

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🔥 Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Get your Firebase configuration from Project Settings > General > Your apps
5. Add the configuration to your `.env.local` file

### Deploying Firestore Security Rules

The project includes security rules for Firestore and Firebase Storage. To deploy them:

1. Install Firebase CLI globally:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Deploy the rules:

#### On Windows:

Run the included batch file:

```bash
deploy-firestore-rules.bat
```

#### On any platform:

Use the Firebase CLI directly:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## 🧩 Usage Guide

### Creating a New Schedule

1. **Set Up School Settings**:

   - Define school hours, lesson durations, and break times
   - Configure working days and advanced constraints

2. **Manage Resources**:

   - Add teachers and their subject qualifications
   - Create classes and assign subjects with required hours
   - Set up rooms and their capacities (optional)

3. **Generate Schedule**:

   - Navigate to the Schedules page
   - Click "Generate Schedule"
   - Review the generated schedule

4. **Customize and Publish**:
   - Make manual adjustments if needed
   - Preview different views (by class, teacher, room)
   - Publish the schedule when ready

### Viewing and Exporting Schedules

- Switch between different view modes (class, teacher, room)
- Export schedules to PDF or Excel format
- Archive old schedules for future reference

## ⚙️ Customization Options

The scheduler supports various customization options:

- **Break Times**: Configure breakfast and lunch break times
- **Subject Distribution**: Set minimum subjects per day
- **Free Periods**: Schedule dedicated free periods for activities
- **Room Assignments**: Enable or disable room constraints
- **Teacher Preferences**: Set teacher availability and preferences
- **Subject Balancing**: Distribute subjects evenly throughout the week

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

Ernest Sakyi - [GitHub Profile](https://github.com/SakyiErnest)

Project Link: [https://github.com/SakyiErnest/Automated-Scheduling-WebApp](https://github.com/SakyiErnest/Automated-Scheduling-WebApp)

---

<div align="center">
  <p>Built with ❤️ for educational institutions worldwide</p>
  <p>© 2024 SchedulEasy. All rights reserved.</p>
</div>
