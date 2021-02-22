require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const { prependOnceListener } = require("process");
const { json2csv } = require("./utils.js");

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
};

const groupSongsByUser = (songs) => {
  const groups = songs.reduce((prev, curr) => {
    const { userId } = curr;
    if (!prev.hasOwnProperty(userId)) {
      return {
        ...prev,
        [userId]: [curr],
      };
    }

    return {
      ...prev,
      [userId]: [...prev[userId], curr],
    };
  }, {});

  return groups;
};

const sum = (arr, attr) =>
  arr.map((i) => Number(i[attr])).reduce((prev, curr) => curr + prev);
const avg = (arr, attr) => sum(arr, attr) / arr.length;

const count = (arr, attr) =>
  arr.reduce((prev, curr) => {
    if (!prev.hasOwnProperty(curr[attr])) {
      return {
        ...prev,
        [curr[attr]]: 1,
      };
    }
    return {
      ...prev,
      [curr[attr]]: prev[curr[attr]] + 1,
    };
  }, {});

const top = (arr, attr) => {
  const _count = count(arr, attr);
  return Object.keys(_count).sort((a, b) => _count[b] - _count[a])[0];
};

const percentage = (arr, attr, value) => {
  return Math.round((arr.filter((s) => s[attr] === value).length / arr.length) * 100)
}

const getSongStats = (songs) => {
  const numberOfSongs = songs.length;
  const release_date = Math.round(avg(songs, "release_date"));
  const _key = top(songs, "key");
  const duration = Math.round(avg(songs, "duration_ms") / 1000);

  const minorPercentage = percentage(songs, 'mode', 'Min' );
  const waltzPercentage = percentage(songs, "time_signature", 3)
  const explicitPercentage =percentage(songs, 'explicit', true); 

  let stats = {
    numberOfSongs,
    release_date,
    key: _key,
    minorPercentage,
    waltzPercentage,
    duration,
    explicitPercentage,
  };

  const averages = [
    { tag: "popularity", percentage: false },
    { tag: "danceability", percentage: true },
    { tag: "energy", percentage: true },
    { tag: "loudness", percentage: false },
    { tag: "speechiness", percentage: true },
    { tag: "acousticness", percentage: true },
    { tag: "instrumentalness", percentage: true },
    { tag: "liveness", percentage: true },
    { tag: "valence", percentage: true },
    { tag: "tempo", percentage: false },
  ];

  averages.forEach((average) => {
    stats[average.tag] = average.percentage
      ? Math.round(avg(songs, average.tag) * 100)
      : Math.round(avg(songs, average.tag));
  });

  return stats;
};


const getUserStats = (groups) => {
  const groupStats = {};
  Object.keys(groups).forEach((key) => {
    const userSongs = groups[key];
    const userStats = getSongStats(userSongs);
    groupStats[key] = userStats;
  });
  return groupStats;
};

const main = async () => {
  fs.readFile("extendedsongs.json", "utf8", async (err, data) => {
    if (err) {
      return console.log(err);
    }
    const songs = JSON.parse(data);
    const totalStats = getSongStats(songs);
    console.log(totalStats);
    const groups = groupSongsByUser(songs);
    const userStats = getUserStats(groups);
    const stats = {
      _total: totalStats,
      ...userStats
    }
    
    fs.writeFile("userstats.json", JSON.stringify(stats), function (err) {
      if (err) {
        return console.log(err);
      }
    });

    let statsCsv =
      "username\t" + Object.keys(totalStats).join("\t") + "\n";

    Object.keys(stats).forEach((userKey) => {
      row = [userKey];
      Object.keys(totalStats).forEach((statsKey) => {
        row.push(stats[userKey][statsKey]);
      });
      statsCsv = statsCsv + row.join("\t") + "\n";
    });

    fs.writeFile("userstats.csv", statsCsv, function (err) {
      if (err) {
        return console.log(err);
      }
    });
  });
};

main();
