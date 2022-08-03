var parser = require("./utils/TTParser");
const calendarGenerator = require("./utils/CalendarGenerator");

var fs = require("fs");
var data = fs.readFileSync("./test-timetable/FallSem2223timetable.html").toString();

const parseddata = parser.ParseHTMLData(data);
const eventList = calendarGenerator.createEventList(parseddata);
const icsOutput = calendarGenerator.createICS(eventList);

fs.writeFile("./output/calendar.ics", icsOutput, (err) => {
  if (err) {
    console.error(err);
  }
});
