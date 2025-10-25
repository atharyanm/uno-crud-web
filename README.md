# Uno Win Rate Calculator

A web application for tracking Uno game statistics, player win rates, and managing game data using Google Sheets as the backend.

## Setup Instructions

### 1. Google Sheets Setup
1. Create a new Google Sheet with the following tabs (sheets):
   - `User` - For user accounts
   - `Player` - For Uno players
   - `Place` - For game locations
   - `Data` - For game results

2. Set up headers for each sheet:
   - **User sheet**: `id_user`, `username`, `password`
   - **Player sheet**: `id_player`, `name`, `date_join`
   - **Place sheet**: `id_place`, `name_place`, `date_join`
   - **Data sheet**: `id`, `name`, `place`, `date`, `lose`

### 2. Google Apps Script Setup
1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. Copy the code from `apps-script.js` into the script editor
4. Save the project
5. Deploy as a web app:
   - Click "Deploy" > "New deployment"
   - Select type "Web app"
   - Execute as "Me"
   - Who has access: "Anyone"
   - Deploy
6. Copy the deployment URL (it will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### 3. Update the Web App
1. Open `koneksi.js`
2. Replace `YOUR_SCRIPT_ID` in the `API_BASE` URL with your actual script ID from step 6

### 4. Add Initial Data
Add at least one user to the User sheet for login:
- id_user: USR_001
- username: admin
- password: admin123

## Running the Application
1. Open `index.html` in a web browser
2. Login with username "admin" and password "admin123"
3. Use the dashboard to manage players, places, users, and view win rates

## Features
- User authentication
- CRUD operations for players, places, and users
- Win rate calculation
- Game history tracking
- Responsive web interface

## Troubleshooting
- Check browser console for detailed error logs
- Ensure Google Apps Script is deployed and accessible
- Verify sheet names match exactly (case-sensitive)
- Make sure CORS is enabled for the web app deployment
