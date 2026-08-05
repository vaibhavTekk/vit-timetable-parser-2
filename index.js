const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;
const multer = require("multer");
const upload = multer({ dest: "./uploads" });

const parser = require("./utils/TTParser");
const calendarGenerator = require("./utils/CalendarGenerator");
const fs = require("fs");

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

app.get("/", (req, res) => {
  const html = fs
    .readFileSync(path.join(__dirname, "pages/index.html"))
    .toString()
    .replace("__GOOGLE_CLIENT_ID__", process.env.GOOGLE_CLIENT_ID || "");
  res.send(html);
});

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

const idPattern = /^[a-zA-Z0-9_-]+$/;

function sanitizeId(id) {
  if (typeof id !== "string" || !idPattern.test(id) || path.basename(id) !== id) {
    throw new Error("Invalid file identifier");
  }
  return id;
}

app.get("/download/:id", (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    res.download(path.join(__dirname, "output", `${id}.ics`), "calendar.ics");
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message, stack: error.stack });
  }
});

app.get("/api/events/:id", (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    const filePath = path.join(__dirname, "output", `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error("Event data not found or has expired");
    }
    const events = JSON.parse(fs.readFileSync(filePath).toString());
    res.json({ events });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message, stack: error.stack });
  }
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
  const googleEvents = calendarGenerator.toGoogleEvents(eventList);
  fs.writeFile(__dirname + `/output/${filename}.ics`, icsOutput, (err) => {
    if (err) {
      console.log("Error creating ICS File" + err.message);
    }
  });
  fs.writeFile(__dirname + `/output/${filename}.json`, JSON.stringify(googleEvents), (err) => {
    if (err) {
      console.log("Error creating Event Data File" + err.message);
    }
  });
}
