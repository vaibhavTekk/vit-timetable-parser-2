//Calendar Generator Example
const slotData = require("./SlotData.json");
const moment = require("moment");
const ics = require("ics");

function findNextDay(weekday, classStart) {
  //1 == monday 2 == tuesday 3 == wednesday 4 == thursday 5 == friday
  const start = moment(classStart).isoWeekday();
  //haven't yet passed the day of the week required:
  if (start <= weekday) {
    //this week's instance of that day
    return moment(classStart).isoWeekday(weekday);
  } else {
    // next week's instance of that same day
    return moment(classStart).add(1, "weeks").isoWeekday(weekday);
  }
}

const sampleData = [
  {
    code: "BMAT201L",
    title: "Complex Variables and Linear Algebra",
    slots: ["A1", "TA1"],
    venue: "AB2- 203",
    faculty: "XYZ",
  },
];

const eventList = [];
const openingDate = moment("20220810");
const lastInstructionalDay = moment("20221123").format("YYYYMMDD[T]HHmm[00Z]");
const repeatRule = `FREQ=WEEKLY;INTERVAL=1;UNTIL=${lastInstructionalDay}`;
sampleData.map((course) => {
  course.slots.map((slot) => {
    slotData[slot].map((timedata) => {
      const firstEventDate = findNextDay(timedata[2], openingDate).format("YYYY-MM-DD").split("-").map(Number);
      const event = {
        start: [...firstEventDate, timedata[0], timedata[1]],
        duration: { minutes: 50 },
        title: course.title,
        recurrenceRule: repeatRule,
        description: course.code,
        location: course.venue,
        organizer: { name: course.faculty },
      };
      eventList.push(event);
    });
  });
});

console.log(eventList);
//console.log(moment().day());
//console.log(findNextDay(2, moment()).format("LL"));

/*const ics = require("ics");

const event = {
  start: [2018, 5, 30, 6, 30],
  duration: { hours: 6, minutes: 30 },
  title: "Bolder Boulder",
  description: "Annual 10-kilometer run in Boulder, Colorado",
  location: "Folsom Field, University of Colorado (finish line)",
  organizer: { name: "Admin", email: "Race@BolderBOULDER.com" },
};*/

const { error, value } = ics.createEvents(eventList);

if (error) {
  console.log(error);
  return;
}

console.log(value);
