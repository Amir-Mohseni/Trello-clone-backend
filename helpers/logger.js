const fs = require("fs");
const colors = require("colors/safe");
const moment = require("moment");

const log = async (data, file = "", type = "") => {
  let logType;

  if (type[0] === "i" || !type.length) {
    logType = "INFO - ";
    console.log("\n*** " + colors.gray.bold(data) + " ***");
  }

  if (type[0] === "w") {
    logType = "WARNING - ";
    console.log("\n*** " + colors.yellow.bold(data) + " ***");
  }

  if (type[0] === "s") {
    logType = "SUCCESS - ";
    console.log("\n*** " + colors.green.bold(data) + " ***");
  }

  if (type[0] === "e") {
    logType = "ERROR - ";
    console.log("*** " + colors.red.bold(data) + " ***");
  }

  fs.appendFile(
    "log.txt",
    `${logType} ${data} AT: ${moment().format("MMMM Do YYYY, h:mm:ss a")}${
      file.length ? " - IN: " + file : ""
    } \n`,
    "utf8",
    (err) => {
      if (err) console.log(colors.red.bold(err));
    }
  );
  return;
};

module.exports = log;
