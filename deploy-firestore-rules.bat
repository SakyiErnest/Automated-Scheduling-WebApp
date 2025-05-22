@echo off
echo Deploying Firestore security rules...
firebase deploy --only firestore:rules
echo Done!
pause
