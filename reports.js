require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const { prependOnceListener } = require("process");
const { json2csv } = require("./utils.js");

const getAttrFromAllUsers = (userStats, attr) =>
  Object.keys(userStats)
    .map(user => ({user, value: userStats[user][attr]}))
    .sort((a,b) => b.value - a.value);

const toplist = (userStats, total, attr, unit = "") => {
  const topList = getAttrFromAllUsers(userStats, 'waltzPercentage');
  let format = `Topist for ${attr} (avg: ${total[attr]}${unit}): \n\n`
  format += topList.map((entry, index) => `#${index + 1} : ${entry.user} (${entry.value}${unit})`).join('\n')
  console.log(format);
}

const main = async () => {
  fs.readFile("userstats.json", "utf8", async (err, data) => {
    if (err) {
      return console.log(err);
    }
    
    const {_total: total, ...userStats} = JSON.parse(data);

    const toplistTango = toplist(userStats, total, 'waltzPercentage', "%")

    console.log(toplistTango);
    /*
    fs.writeFile("userstats.csv", statsCsv, function (err) {
      if (err) {
        return console.log(err);
      }
    });
    */
  });
};

main();
