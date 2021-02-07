# To run scraper

1. Get an token at https://developer.spotify.com/console/get-playlist with scopes:
- playlist-modify-public 
- playlist-modify-private
- user-read-private
- user-read-email

2. Create an .env with `SPOTIFY_TOKEN = [your token here]`
3. Run `node index.js` which will generate songs.json and songs.csv
4. Open `songs.csv` in numbers or google sheets and marvel at our collective effort!

# To create MEGA playlist

Run `node songs2playlists.js` (requires a songs.json file to be present)

# To get even more info!

Run `node extendedsongs.js` (requires a songs.json file to be present and will produce an extendedsongs.csv with same info as songs.csv plus additional info)

# To do:

- Error handling
- Handle multiple spotify playlists in blogpost
- Handle non spotify playlists (if possible, currently skipped)
- Fix proper auth rather then token in .env (expires pretty quickly)
- Option to scrape only new blogs and append to songs.cvs instead of generating from scratch
- Maybe som FE to sort, filter and get some statistics?
