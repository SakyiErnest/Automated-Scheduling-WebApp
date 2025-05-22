/**
 * Firebase Rules Deployment Script
 * 
 * This script helps deploy Firestore security rules to your Firebase project.
 * 
 * Prerequisites:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login to Firebase: firebase login
 * 3. Initialize Firebase: firebase init (select Firestore)
 * 
 * Usage:
 * node deploy-rules.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if firebase-tools is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Firebase CLI is not installed. Please install it using: npm install -g firebase-tools');
  process.exit(1);
}

// Check if the user is logged in to Firebase
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
} catch (error) {
  console.error('You are not logged in to Firebase. Please login using: firebase login');
  process.exit(1);
}

// Check if firestore.rules file exists
const rulesPath = path.join(__dirname, 'firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error('firestore.rules file not found. Please create it first.');
  process.exit(1);
}

// Check if firebase.json exists
const firebaseConfigPath = path.join(__dirname, 'firebase.json');
if (!fs.existsSync(firebaseConfigPath)) {
  console.log('firebase.json not found. Creating a basic configuration...');
  
  const basicConfig = {
    "firestore": {
      "rules": "firestore.rules",
      "indexes": "firestore.indexes.json"
    }
  };
  
  fs.writeFileSync(firebaseConfigPath, JSON.stringify(basicConfig, null, 2));
  console.log('Created firebase.json with basic configuration.');
  
  // Create empty indexes file if it doesn't exist
  const indexesPath = path.join(__dirname, 'firestore.indexes.json');
  if (!fs.existsSync(indexesPath)) {
    fs.writeFileSync(indexesPath, JSON.stringify({ "indexes": [] }, null, 2));
    console.log('Created empty firestore.indexes.json file.');
  }
}

// Deploy the rules
console.log('Deploying Firestore security rules...');
try {
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('Firestore security rules deployed successfully!');
} catch (error) {
  console.error('Failed to deploy Firestore security rules:', error.message);
  process.exit(1);
}
