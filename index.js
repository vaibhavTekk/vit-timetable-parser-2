const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;
const multer = require("multer");
const upload = multer({ dest: "./uploads" });

const parser = require("./utils/TTParser");
const calendarGenerator = require("./utils/CalendarGenerator");
const googleCalendarService = require("./utils/GoogleCalendarService");
const { verifyAuth } = require("./middleware/auth");
const fs = require("fs");

// Parse JSON bodies
app.use(express.json());

let interval = 5 * 60 * 1000;
let fileLength = 15 * 60 * 1000;
function deleteFiles(folder) {
  const filedir = __dirname + `/${folder}`;
  fs.readdir(filedir, (err, files) => {
    if (err) {
      return;
    }
    files.forEach((file, index) => {
      fs.stat(path.join(filedir, file), (err, stat) => {
        let now, filedate;
        if (err) {
          return;
        }
        now = new Date().getTime();
        filedate = new Date(stat.ctime).getTime() + fileLength;
        if (now > filedate) {
          fs.unlink(path.join(filedir, file), (err) => {
            if (err) {
              return;
            }
            console.log("fileremoved");
          });
        }
      });
    });
  });
}
setInterval(() => {
  console.log("setinterval ran");
  deleteFiles("uploads");
  deleteFiles("output");
}, interval);

app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile("./pages/index.html", { root: __dirname }));

app.post("/api/upload", upload.single("timetable"), (req, res) => {
  try {
    if (req.file && req.body.startDate && req.body.endDate) {
      const startDate = req.body.startDate.toString().replace(/\-/g, "");
      const endDate = req.body.endDate.toString().replace(/\-/g, "");
      const filename = req.file.filename;
      const filepath = `${req.file.destination}/${req.file.filename}`;
      generateICSFile(filepath, startDate, endDate, filename);
      res.send({
        filename,
      });
      //res.redirect(`/download/${filename}`);
    } else {
      throw new Error("Fill all Form Data");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message, stack: error.stack });
    //throw new Error(error.message);
  }
});

app.get("/download/:id", (req, res) => {
  try {
    res.download(__dirname + `/output/${req.params.id}.ics`, "calendar.ics");
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message, stack: error.stack });
  }
});

// New Google Calendar API endpoints
app.post("/api/calendar/create", verifyAuth, async (req, res) => {
  try {
    const { accessToken, calendarName } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    const calendar = await googleCalendarService.createCalendar(
      accessToken, 
      calendarName || "VIT Timetable"
    );

    res.json({ calendar });
  } catch (error) {
    console.error("Error creating calendar:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/calendar/add-events", verifyAuth, upload.single("timetable"), async (req, res) => {
  try {
    const { accessToken, calendarId, startDate, endDate } = req.body;
    
    if (!accessToken || !calendarId || !req.file || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Parse timetable and generate events
    const filepath = `${req.file.destination}/${req.file.filename}`;
    const data = fs.readFileSync(filepath).toString();
    const parsedData = parser.ParseHTMLData(data);
    const formattedStartDate = startDate.toString().replace(/\-/g, "");
    const formattedEndDate = endDate.toString().replace(/\-/g, "");
    const eventList = calendarGenerator.createEventList(parsedData, formattedStartDate, formattedEndDate);

    // Add events to Google Calendar
    const createdEvents = await googleCalendarService.addEventsToCalendar(
      accessToken,
      calendarId,
      eventList
    );

    res.json({ 
      message: "Events added successfully",
      eventsCount: createdEvents.length,
      calendarId 
    });
  } catch (error) {
    console.error("Error adding events to calendar:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/calendar/list", verifyAuth, async (req, res) => {
  try {
    const { accessToken } = req.query;
    
    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    const calendars = await googleCalendarService.getCalendars(accessToken);
    res.json({ calendars });
  } catch (error) {
    console.error("Error fetching calendars:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get Firebase config for frontend
app.get("/api/firebase-config", (req, res) => {
  if (!googleCalendarService.isConfigured()) {
    return res.status(503).json({ 
      error: 'Firebase is not configured',
      configured: false 
    });
  }
  
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    configured: true
  });
});

app.use((req, res) => {
  res.status(400).sendFile("./pages/404.html", { root: __dirname });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

function generateICSFile(filepath, startDate, endDate, filename) {
  let data = fs.readFileSync(filepath).toString();
  const parseddata = parser.ParseHTMLData(data);
  const eventList = calendarGenerator.createEventList(parseddata, startDate, endDate);
  const icsOutput = calendarGenerator.createICS(eventList);
  fs.writeFile(__dirname + `/output/${filename}.ics`, icsOutput, (err) => {
    if (err) {
      throw new Error("Error creating ICS File" + err.error + "-" + err.message);
    }
  });
}
