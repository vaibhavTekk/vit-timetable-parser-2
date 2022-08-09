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

app.get("/", (req, res) => res.sendFile("./pages/index.html", { root: __dirname }));

app.post("/api/upload", upload.single("timetable"), (req, res) => {
  try {
    if (req.file && req.body.startDate && req.body.endDate) {
      const startDate = req.body.startDate.toString().replace(/\-/g, "");
      const endDate = req.body.endDate.toString().replace(/\-/g, "");
      const filename = req.file.filename;
      const filepath = `${req.file.destination}/${req.file.filename}`;
      setTimeout(() => {
        fs.unlink(__dirname + "/uploads/" + filename, (err) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("fileremoved");
          //file removed
        });
      }, 900000);
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

app.use((req, res) => {
  res.status(400).sendFile("./pages/404.html", { root: __dirname });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

function generateICSFile(filepath, startDate, endDate, filename) {
  let data = fs.readFileSync(filepath).toString();
  const parseddata = parser.ParseHTMLData(data);
  const eventList = calendarGenerator.createEventList(parseddata, startDate, endDate);
  const icsOutput = calendarGenerator.createICS(eventList);
  fs.writeFile(`./output/${filename}.ics`, icsOutput, (err) => {
    if (err) {
      throw new Error("Error creating ICS File");
    }
  });
  setTimeout(() => {
    fs.unlink(__dirname + `/output/${filename}.ics`, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("fileremoved");
      //file removed
    });
  }, 900000);
}
