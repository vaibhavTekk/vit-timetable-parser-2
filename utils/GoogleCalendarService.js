const { google } = require('googleapis');
const { admin, isInitialized, hasValidConfig } = require('./firebase');

class GoogleCalendarService {
  constructor() {
    this.calendar = google.calendar('v3');
  }

  // Check if Firebase is properly configured
  isConfigured() {
    return hasValidConfig() && isInitialized();
  }

  // Verify the Firebase ID token and get user info
  async verifyToken(idToken) {
    if (!admin) {
      throw new Error('Firebase is not configured. Please set up Firebase credentials.');
    }
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid Firebase token: ' + error.message);
    }
  }

  // Create OAuth2 client for Google Calendar API
  createOAuth2Client(accessToken) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }

  // Create a new calendar
  async createCalendar(accessToken, calendarName = 'VIT Timetable') {
    try {
      const auth = this.createOAuth2Client(accessToken);
      
      const calendar = {
        summary: calendarName,
        description: 'VIT University Timetable - Generated from VTOP',
        timeZone: 'Asia/Kolkata'
      };

      const response = await this.calendar.calendars.insert({
        auth: auth,
        resource: calendar
      });

      return response.data;
    } catch (error) {
      throw new Error('Error creating calendar: ' + error.message);
    }
  }

  // Add events to Google Calendar
  async addEventsToCalendar(accessToken, calendarId, events) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const createdEvents = [];

      for (const event of events) {
        const calendarEvent = this.convertToGoogleCalendarEvent(event);
        
        const response = await this.calendar.events.insert({
          auth: auth,
          calendarId: calendarId,
          resource: calendarEvent
        });

        createdEvents.push(response.data);
      }

      return createdEvents;
    } catch (error) {
      throw new Error('Error adding events to calendar: ' + error.message);
    }
  }

  // Convert event from our format to Google Calendar format
  convertToGoogleCalendarEvent(event) {
    // Convert start date array to ISO string
    const startDate = new Date(
      event.start[0], // year
      event.start[1] - 1, // month (0-indexed)
      event.start[2], // day
      event.start[3], // hour
      event.start[4] // minute
    );

    // Calculate end time based on duration
    const endDate = new Date(startDate);
    if (event.duration.hours) {
      endDate.setHours(endDate.getHours() + event.duration.hours);
    }
    if (event.duration.minutes) {
      endDate.setMinutes(endDate.getMinutes() + event.duration.minutes);
    }

    const googleEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Kolkata'
      }
    };

    // Add recurrence rule if present
    if (event.recurrenceRule) {
      googleEvent.recurrence = [`RRULE:${event.recurrenceRule}`];
    }

    return googleEvent;
  }

  // Get user's calendar list
  async getCalendars(accessToken) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      
      const response = await this.calendar.calendarList.list({
        auth: auth
      });

      return response.data.items;
    } catch (error) {
      throw new Error('Error fetching calendars: ' + error.message);
    }
  }
}

module.exports = new GoogleCalendarService();