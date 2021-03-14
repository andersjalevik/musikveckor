require("dotenv").config();
const axios = require("axios");
const { constants } = require("buffer");
const fs = require("fs");
const { prependOnceListener } = require("process");
const { json2csv } = require("./utils.js");

const getAttrFromAllUsers = (userStats, attr) => {
  return Object.keys(userStats)
    .map(user => ({user, value: userStats[user][attr]}))
    .sort((a,b) => b.value - a.value);
}
const toplist = (userStats, total, attr, unit = "") => {
  const topList = getAttrFromAllUsers(userStats, attr);
  let format = `<H2>Toplist for ${attr} (avg: ${total[attr]}${unit})</H2>`
  format += topList.map((entry, index) => `#${index + 1} : ${entry.user} (${entry.value}${unit})`).join('<BR>')
  format += "<BR><BR>"
  return format
}

const formatSong = (song, attr, unit = "", dataFormatter) => `${song.artists} - ${song.song} (${song.user} @ ${song.pageHref.split('/')[5].split('.htm')[0]}) : ${dataFormatter(song[attr])}${unit}<BR>`

const minmax = (songs, attr, unit, dataFormatter = (v) => v) => {
  songs.sort((a,b)=> b[attr] - a[attr])
  const min = songs[0];
  const max = songs[songs.length-1];

  let format = `Highest: ${formatSong(min, attr, unit, dataFormatter)}`;
  format += `Lowest: ${formatSong(max, attr, unit, dataFormatter)}<BR>`;
  return format
}

const main = async () => {
  const {_total: total, ...userStats} = JSON.parse(await fs.readFileSync("userstats.json", "utf8"));
  const songs = JSON.parse(await fs.readFileSync("extendedsongs.json", "utf8"));
  const sections = []

  const numericKeys = ['danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo', 'popularity', 'release_date']

  numericKeys.forEach(key => {
    sections.push(toplist(userStats, total, key, ""))
    sections.push(minmax(songs, key, ""))  
  })

  const percentageKeys = ['minorPercentage', 'waltzPercentage', 'explicitPercentage']
  percentageKeys.forEach(key => {
    sections.push(toplist(userStats, total, key, "%"))
  })

  sections.push(toplist(userStats, total, 'numberOfSongs', " songs"))
  sections.push(toplist(userStats, total, 'key', ""))

  sections.push(toplist(userStats, total, 'duration', " sec"))
  sections.push(minmax(songs, 'duration_ms', " sec", ms => Math.round(ms / 1000)))  

  const document = sections.join('<BR>');
  // console.log(document)


  fs.writeFile("report.html", document, function (err) {
    if (err) {
      return console.log(err);
    }
  });
};

main();
