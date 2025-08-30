# VIT Timetable Parser

A Simple timetable parser that takes VTOP html page as input and outputs an ICS calendar file. Now with **Google Calendar integration** using Firebase!

### Working App Deployed at [https://vit-timetable.up.railway.app/](https://vit-timetable.up.railway.app/)

## Features

- Parse VIT VTOP timetable HTML files
- Generate ICS calendar files for manual import
- **NEW:** Direct Google Calendar integration with Firebase authentication
- Automatic creation of calendar events with proper recurrence rules
- Support for all major calendar applications

## Basic Use

Requirements: NodeJS, Firebase account (optional for Google Calendar integration)

```bash
$ git clone https://github.com/vaibhavTekk/vit-timetable-parser-2.git
$ cd vit-timetable-parser-2
$ npm install
$ npm run dev # to run the development server
```

Navigate to [http://localhost:3000/](http://localhost:3000/) to use the app

## Google Calendar Integration Setup

### 1. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and add Google as a sign-in provider
3. Enable Google Calendar API in Google Cloud Console for your project
4. Create a service account and download the JSON key file
5. Copy `.env.example` to `.env` and fill in your Firebase configuration

### 2. Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Service Account (from your service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# Firebase Web App Configuration (from your web app config)
FIREBASE_API_KEY=your-web-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

### 3. Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Calendar API for your project
3. Ensure your OAuth consent screen is configured
4. Add the Calendar scope: `https://www.googleapis.com/auth/calendar`

## How to Use

### Traditional Method (ICS File)
1. Upload your VTOP timetable HTML file
2. Set semester start and end dates
3. Click "Generate Calendar File"
4. Download and import the ICS file to your calendar app

### Google Calendar Integration
1. Click "Sign in with Google" in the top navigation
2. Grant calendar permissions when prompted
3. Upload your timetable file and set dates
4. Click "Add to Google Calendar"
5. A new calendar "VIT Timetable" will be created with all your classes

## API Endpoints

- `GET /api/firebase-config` - Get Firebase configuration for frontend
- `POST /api/calendar/create` - Create a new Google Calendar (requires auth)
- `POST /api/calendar/add-events` - Add events to Google Calendar (requires auth)
- `GET /api/calendar/list` - List user's calendars (requires auth)

## Dependencies

- Express.js for the web server
- Firebase Admin SDK for authentication
- Google APIs for Calendar integration
- Cheerio for HTML parsing
- ICS for calendar file generation
- Moment.js for date handling

## License

ISC
