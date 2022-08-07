const express = require("express");
const app = express();
const port = 3000;
const multer = require("multer");
const upload = multer({ dest: "./uploads" });
const path = require("path");

var parser = require("./utils/TTParser");
const calendarGenerator = require("./utils/CalendarGenerator");
var fs = require("fs");

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
    res.status(400).send(error);
  }
});

app.get("/download/:id", (req, res) => {
  try {
    res.download(__dirname + `/output/${req.params.id}.ics`, "calendar.ics");
  } catch (error) {
    res.status(400).send(error);
  }
});

app.use((req, res) => {
  res.status(400).sendFile("./pages/404.html", { root: __dirname });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

function generateICSFile(filepath, startDate, endDate, filename) {
  var data = fs.readFileSync(filepath).toString();

  const parseddata = parser.ParseHTMLData(data);
  const eventList = calendarGenerator.createEventList(parseddata, startDate, endDate);
  const icsOutput = calendarGenerator.createICS(eventList);
  fs.writeFile(`./output/${filename}.ics`, icsOutput, (err) => {
    if (err) {
      throw new Error(err);
    }
  });
}

/*




*/
