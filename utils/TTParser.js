const cheerio = require("cheerio");
const cheerioTableParser = require("cheerio-tableparser");

function getInnerText(html) {
  return cheerio
    .load(html)
    .text()
    .toString()
    .replace(/[\t\n]/g, "")
    .trim();
}

function getCourseList(table) {
  let coursearray = table[2]
    .map((e, index) => {
      return getInnerText(e);
    })
    .filter(Boolean);

  let facultyarray = table[8]
    .map((e, index) => {
      return getInnerText(e);
    })
    .filter(Boolean);
  let slotarray = table[7]
    .map((e, index) => {
      return getInnerText(e);
    })
    .filter(Boolean);

  //creating an array of objects
  let objectarr = [];
  for (let i = 1; i <= coursearray.length - 1; i++) {
    const building = slotarray[i].split("-")[1].trim();
    const room = slotarray[i].split("-")[2];
    const venue = `${building}${room ? `- ${room}` : ""}`;
    const courseObject = {
      code: coursearray[i].split("-")[0].trim(),
      type: coursearray[i].split("-")[0].trim().slice(-1),
      title: coursearray[i].split("-")[1].split("(")[0].trim(),
      slots: slotarray[i].split("-")[0].trim().split("+"),
      venue,
      faculty: facultyarray[i].split("-")[0].trim(),
    };
    objectarr.push(courseObject);
  }
  return objectarr;
}

function ParseHTMLData(data) {
  const $ = cheerio.load(data);
  cheerioTableParser($);
  let table = $("table").first().parsetable();
  return getCourseList(table);
}

module.exports = { ParseHTMLData };
