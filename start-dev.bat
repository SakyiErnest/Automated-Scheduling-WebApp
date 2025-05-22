@echo off
echo Starting development servers...

:: Start the Python backend
start cmd /k "cd scheduler-backend && ..\venv\Scripts\python app.py"

:: Start the Next.js frontend
start cmd /k "npm run dev"

echo Development servers started!
