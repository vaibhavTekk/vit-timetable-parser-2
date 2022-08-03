var parser = require("./utils/TTParser");

var fs = require("fs");
var data = fs.readFileSync("./test-timetable/FallSem2223timetable.html").toString();

console.log(parser.ParseHTMLData(data));
