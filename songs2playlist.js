require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
};

const getUserId = async () => {
  const { status, data } =
    (await axios({
      method: "get",
      url: `https://api.spotify.com/v1/me`,
      headers,
    })) || {};

  const userId = data?.id;
  return userId;
};

const createPlaylist = async (userId) => {
  const { status, data } = await axios({
    method: "post",
    url: `https://api.spotify.com/v1/users/${userId}/playlists`,
    headers,
    data: {
      name: "Mega Musikveckor",
      description: "Alla musikveckorlistor i en enda lista",
      public: false,
    },
  });

  return data?.id;
};

const addSongsToPlaylist = async (playlistId, songs) => {
  const uris = songs.map((song) => `spotify:track:${song.songId}`);

  const { status, data } = await axios({
    method: "post",
    url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    headers,
    data: {
      uris,
    },
  });
};

const main = async () => {
  fs.readFile("songs.json", "utf8", async (err, data) => {
    if (err) {
      return console.log(err);
    }
    const songs = JSON.parse(data);
    // for debugging
    // const songs = JSON.parse(data).slice(0, 100);

    const userId = await getUserId();
    const playlistId = await createPlaylist(userId);

    const batchLimit = 100; // spotify limit
    let index = 0;
    let moreSongs = true;

    while (moreSongs) {
      batch = songs.slice(index, index + batchLimit);
      await addSongsToPlaylist(playlistId, batch);

      index = index + batchLimit;
      moreSongs = index < songs.length;
      console.log(
        `Added songs: ${index} to ${
          index + batchLimit
        }, continue to add? ${moreSongs}`
      );
    }
  });
};

main();
