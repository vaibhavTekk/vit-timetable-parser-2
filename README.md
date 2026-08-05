# VIT Timetable Parser

A Simple timetable parser that takes VTOP html page as input and outputs an ICS calendar file

### Working App Deployed at [https://vit-timetable.up.railway.app/](https://vit-timetable.up.railway.app/)

## Basic Use

Requirements : NodeJS

```
$ git clone https://github.com/vaibhavTekk/vit-timetable-parser.git
$ cd vit-timetable-parser
$ npm install
$ npm run dev //to run the development server
```

navigate to [http://localhost:3000/](http://localhost:3000/) to use the app

## Google Calendar Direct Import (optional)

The app can push parsed timetable events directly into a user's Google Calendar via OAuth,
in addition to the existing `.ics` download.

1. Create/select a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Calendar API** for that project.
3. Create an **OAuth 2.0 Client ID** (Application type: Web application), and add your
   deployed domain and `http://localhost:3000` as Authorized JavaScript origins.
4. Set the `GOOGLE_CLIENT_ID` environment variable to the generated Client ID before starting
   the server (e.g. in a `.env` file or your deployment platform's config):
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
5. If `GOOGLE_CLIENT_ID` is not set, the "Add to Google Calendar" button will show an error
   when clicked, and users can still use the "Download" button as before.

When configured, clicking "Add to Google Calendar" after generating a calendar file will:
- Prompt the user to sign in and grant `calendar.events` access via Google Identity Services.
- Fetch the generated events from the server and insert them into the user's primary calendar.
