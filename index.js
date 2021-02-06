require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fech all blog pages from musikveckor.blogspot.com
const getPages = async () => {
  try {
    const mapper = (json) => json.feed.entry.map((e) => e.link[4].href);
    const maxLimit = 150;

    let pages = [];
    let startIndex = 1;
    let moreToFetch = true;

    while (moreToFetch) {
      const { data } = await axios.get(
        `http://musikveckor.blogspot.com/feeds/posts/default?max-results=${maxLimit}&start-index=${startIndex}&alt=json`
      );
      console.log(
        `✅  Fetched posts ${startIndex} to ${startIndex + maxLimit}`
      );

      pages = pages.concat(mapper(data));

      const total = data.feed.openSearch$totalResults["$t"]; // TODO: This total property sounds internal, maybe better to just fetch until you get nothing back.
      startIndex = pages.length + 1;
      moreToFetch = pages.length < total;
    }
    return pages;
  } catch (error) {
    console.warn(
      `❌  Error when fetching http://musikveckor.blogspot.com/feeds/posts/default?max-results=${maxLimit}&start-index=${startIndex}&alt=json`
    );
    // throw error;
  }
};

// Scrape spotify playlists from blog post page
const getPlaylistFromPage = async (pageHref) => {
  const regExp =
    "(https?://open.spotify.com/playlist/|https?://open.spotify.com/user/([a-zA-Z0-9_åäöÅÄÖ.]+)/playlist/|spotify:user:([a-zA-Z0-9_åäöÅÄÖ.]+):playlist:|spotify:playlist:)([a-zA-Z0-9]+)";

  try {
    const { status, data } = await axios.get(pageHref);
    if (status !== 200) {
      console.warn(`❌  Status ${status} when fetching ${pageHref}`);
    }

    const match = data.match(regExp);
    if (match && match.length > 4) {
      return { playlistId: match[4], pageHref };
    } else {
      return false;
    }
  } catch (error) {
    console.warn(`❌  Error when fetching ${pageHref}`);
    // throw error;
  }
};

const fetchSongsFromPlaylist = async (playlistId) => {
  try {
    const call = {
      method: "get",
      url: `https://api.spotify.com/v1/playlists/${playlistId}`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
      },
    };

    const { data, status, statusText, headers } = await axios(call);
    console.log(
      `✅  Fetch songs from playlist ${playlistId} DONE, status: ${status}`
    );

    // Check Rate limit and retrigger with timeout (not happened yet so not tested either!)
    if (status === 429) {
      const retryTime = (headers.Retry - After * 1000) | 5000;
      console.log(`⏲️ Have to wait ${retryTime} ms until next request.`);
      await wait(retryTime);
      return fetchSongsFromPlaylist(playlistId);
    }

    if (status !== 200) {
      console.warn(
        `❌  Status ${status} (${statusText}) when fetching playlist ${playlistId}.`
      );
    }

    return { data, status, headers };
  } catch (error) {
    console.warn(
      `❌  Error when fetching https://api.spotify.com/v1/playlists/${playlistId}`
    );
    //throw error;
  }
};

const main = async () => {
  // const pages = await getPages();
  const pages = ["http://musikveckor.blogspot.com/2021/02/lynchdom.html"];
  console.log(`✅  Fetched ${pages.length} pages`);

  const playlists = [];
  for (const page of pages) {
    const playlist = await getPlaylistFromPage(page);
    if (!playlist) {
      console.warn(
        `❌  Found no playlist on page ${page} (youtube or soundcloud list?)`
      );
    } else {
      playlists.push(playlist);
    }
  }

  console.log(
    `✅  Found ${playlists.length} playlists on ${pages.length} pages`
  );

  fs.writeFile("playlists.json", JSON.stringify(playlists), function (err) {
    if (err) return console.log("Save platlists.json error: ", err);
  });

  let songs = [];
  for (const playlist of playlists) {
    const { playlistId, pageHref } = playlist;
    const { data, status, headers } =
      (await fetchSongsFromPlaylist(playlistId)) || {};

    if (!data) {
      console.warn(`❌  No data for playlist ${playlistId}, removed playlist?`);
    } else {
      const {
        tracks: { items },
        owner: { display_name: user, id: userId },
      } = data;
      const playlistSongs = items.map(({ track }) => {
        const { name: song, id: songId } = track;
        const artists = track.artists.map((artist) => artist.name).join(", ");
        return {
          artists,
          song,
          songId,
          pageHref,
          playlistId,
          user,
          userId,
        };
      });
      console.log(
        `✅  fetched ${playlistSongs.length} songs from playlist ${playlistId}`
      );
      songs = songs.concat(playlistSongs);
      console.log(`✅  fetched total ${songs.length} songs`);
    }
  }
  fs.writeFile("songs.json", JSON.stringify(songs), function (err) {
    if (err) {
      return console.log("Save songs.json error: ", err);
    }

    let csv = Object.keys(songs[0]).join("\t") + "\n";
    songs.forEach((song) => {
      csv = csv + Object.values(song).join("\t") + "\n";
    });

    fs.writeFile("songs.csv", csv, function (err) {
      if (err) {
        return console.log(err);
      }
    });

    console.log(`✅  All done, songs saved in songs.json and songs.csv songs`);
  });
};

main();
