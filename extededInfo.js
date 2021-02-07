require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const { json2csv } = require("./utils.js");

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
};

const getAdditionalSongInfo = async (songs) => {
  const ids = songs.map((song) => song.songId).join(",");

  const { data } = await axios({
    method: "get",
    url: `https://api.spotify.com/v1/tracks`,
    headers,
    params: {
      ids,
    },
  });

  const { tracks } = data;
  const extendedInformation = tracks.reduce((prev, curr, index, arr) => {
    const {
      explicit,
      popularity,
      track_number,
      disc_number,
      preview_url,
      available_markets,
      album: { release_date },
    } = curr;

    return {
      ...prev,
      [curr.id]: {
        explicit,
        popularity,
        release_date: release_date.slice(0, 4),
        preview_url,
        track_number,
        disc_number,
        available_markets: available_markets.join(","),
      },
    };
  }, {});

  const {
    data: { audio_features: _audio_features },
  } = await axios({
    method: "get",
    url: `https://api.spotify.com/v1/audio-features`,
    headers,
    params: {
      ids,
    },
  });

  const keyTranslation = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const modeTranslation = ["Maj", "Min"];

  const audio_features = _audio_features.reduce((prev, curr, index, arr) => {
    const {
      danceability,
      energy,
      key,
      loudness,
      mode,
      speechiness,
      acousticness,
      instrumentalness,
      liveness,
      valence,
      tempo,
      duration_ms,
      time_signature,
    } = curr;

    return {
      ...prev,
      [curr.id]: {
        danceability,
        energy,
        key: keyTranslation[key],
        loudness,
        mode: modeTranslation[mode],
        speechiness,
        acousticness,
        instrumentalness,
        liveness,
        valence,
        tempo,
        duration_ms,
        time_signature,
      },
    };
  }, {});

  const total = songs.map((song) => ({
    ...song,
    ...audio_features[song.songId],
    ...extendedInformation[song.songId],
  }));

  return total;
};

const main = async () => {
  fs.readFile("songs.json", "utf8", async (err, data) => {
    if (err) {
      return console.log(err);
    }
    const songs = JSON.parse(data); //.slice(0, 2);
    const batchLimit = 50; // spotify limit
    const extendedSongs = [];
    let index = 0;
    let moreSongs = true;

    while (moreSongs) {
      batch = songs.slice(index, index + batchLimit);
      extendedSongs.push(...(await getAdditionalSongInfo(batch)));
      console.log(`✅  Fetched ${extendedSongs.length} of ${songs.length}`);

      index = index + batchLimit;
      moreSongs = index < songs.length;
    }

    fs.writeFile(
      "extendedsongs.json",
      JSON.stringify(extendedSongs),
      function (err) {
        if (err) {
          return console.log(err);
        }
      }
    );

    fs.writeFile("extendedsongs.csv", json2csv(extendedSongs), function (err) {
      if (err) {
        return console.log(err);
      }
    });
  });
};

main();
