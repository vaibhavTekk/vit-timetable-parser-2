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

function createEventList(parsedData, startDate, endDate) {
  const eventList = [];
  const openingDate = moment(startDate);
  const lastInstructionalDay = moment(endDate).format("YYYYMMDD[T]HHmm[00Z]");
  const repeatRule = `FREQ=WEEKLY;INTERVAL=1;UNTIL=${lastInstructionalDay}`;
  parsedData.map((course) => {
    let slotlist = [];
    let duration = {};

    if (course.type === "P" || course.type === "E") {
      if (course.slots.length == 2) {
        slotlist = [course.slots[0]];
        duration = { hours: 1, minutes: 40 };
      } else if (course.slots.length == 4) {
        slotlist = [course.slots[0], course.slots[2]];
        duration = { hours: 1, minutes: 40 };
      } else {
        slotlist = course.slots;
        duration = { minutes: 50 };
      }
    } else {
      slotlist = course.slots;
      duration = { minutes: 50 };
    }

    slotlist.map((slot) => {
      if (slot !== "NIL" && slotData[slot]) {
        slotData[slot].map((timedata) => {
          const firstEventDate = findNextDay(timedata[2], openingDate).format("YYYY-MM-DD").split("-").map(Number);
          const event = {
            start: [...firstEventDate, timedata[0], timedata[1]],
            duration,
            title: `${course.title} - ${course.code}`,
            recurrenceRule: repeatRule,
            description: course.code,
            location: course.venue,
            organizer: { name: course.faculty },
          };
          eventList.push(event);
        });
      }
    });
  });

  return eventList;
}

/*const ics = require("ics");

const event = {
  start: [2018, 5, 30, 6, 30],
  duration: { hours: 6, minutes: 30 },
  title: "Bolder Boulder",
  description: "Annual 10-kilometer run in Boulder, Colorado",
  location: "Folsom Field, University of Colorado (finish line)",
  organizer: { name: "Admin", email: "Race@BolderBOULDER.com" },
};*/

function createICS(list) {
  const { error, value } = ics.createEvents(list);
  if (error) {
    return error;
  }
  return value;
}

module.exports = { createICS, createEventList };
